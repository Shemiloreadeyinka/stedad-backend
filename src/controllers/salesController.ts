import Sales, { Isale } from "../models/salesModel";
import { Request, Response } from "express";
import Product from "../models/productModel";
import SalesCounter from "../models/salesCounterModel";
import { AuthUser } from "../middlewares/authMiddleware";
import { isValidObjectId } from "mongoose";
import { printReceipt } from "../services/printerService";
import { ReceiptData } from "../templates/receiptTemplate";

const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

const toParamString = (value: string | string[] | undefined): string =>
    Array.isArray(value) ? value[0] : (value || "");

export const getAllSales = async (req: Request, res: Response): Promise<void> => {
    try {
        const sales = await Sales.find().populate({
            path: "staffId", select: "fullname -_id"
        }).populate({
            path: "items.product",
            select: "name price"
        }).lean();
        res.status(200).json({ message: "Sales retrieved successfully", sales })
    } catch (error) {
        res.status(500).json({ message: "Error retrieving sales", error: error instanceof Error ? error.message : "Unknown error" })
    }
}
export const getSaleById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        if (!id) {
            res.status(400).json({ message: "Please provide the sale ID" })
            return;
        }
        const sale: Isale | null = await Sales.findById(id).populate({
            path: "staffId", select: "fullname -_id"
        }).populate({
            path: "items.product",
            select: "name price"
        }).lean();
        if (!sale) {
            res.status(404).json({ message: "Sale not found" })
            return;
        }
        res.status(200).json({ message: "Sale retrieved successfully", sale })
    } catch (error) {
        res.status(500).json({ message: "Error retrieving sale", error: error instanceof Error ? error.message : "Unknown error" })
    }
}
export const createSale = async (req: Request, res: Response): Promise<void> => {
    try {
        const { items, customerName, paymentMethod, isPaid } = req.body;

        // 1️⃣ Validate required fields
        if (!items || !items.length || !customerName || !paymentMethod || isPaid === undefined) {
            res.status(400).json({ message: "Please provide all required fields" });
            return;
        }

        // 2️⃣ Get logged-in staff
        if (!req.user?.id) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const staffId = req.user.id;

        // 3️⃣ Fetch product info
        const productIds = items.map((item: { product: string; quantity: number }) => item.product);
        const products = await Product.find({ _id: { $in: productIds } }).lean();

        // 4️⃣ Build sale items with prices and check stock
        let totalAmount = 0;
        const saleItems = items.map((item: { product: string; quantity: number }) => {
            const product = products.find(p => p._id.toString() === item.product);
            if (!product) throw new Error(`Product not found: ${item.product}`);
            if (product.quantityLeft < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);

            totalAmount += product.price * item.quantity;

            return {
                product: product._id,
                quantity: item.quantity,
                price: product.price,
            };
        });

        // 5️⃣ Generate daily-incrementing salesId
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const dateKey = `${month}${day}`;

        const counter = await SalesCounter.findOneAndUpdate(
            { date: dateKey },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        const sequence = String(counter.seq).padStart(3, "0");
        const salesId = `sale-${dateKey}-${sequence}`;

        // 6️⃣ Update product stock
        await Promise.all(
            items.map(async (item: { product: string; quantity: number }) => {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { quantityLeft: -item.quantity },
                });
            })
        );

        // 7️⃣ Save the sale
        const sale = new Sales({
            salesId,
            staffId,
            customerName,
            items: saleItems,
            totalAmount,
            paymentMethod,
            isPaid,
        });

        await sale.save();

        res.status(201).json({
            message: "Sale created successfully",
            salesId,
            totalAmount,
            items: saleItems,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error creating sale",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};


export const updateSale = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        if (!id) {
            res.status(400).json({ message: "Please provide the sale ID" })
            return;
        }

        // Whitelist: only allow safe, non-business-critical fields to be patched
        const { paymentMethod, isPaid, customerName } = req.body;
        const allowedUpdate: Record<string, unknown> = {};
        if (paymentMethod !== undefined) allowedUpdate.paymentMethod = paymentMethod;
        if (isPaid !== undefined) allowedUpdate.isPaid = isPaid;
        if (customerName !== undefined) allowedUpdate.customerName = customerName;

        const sale = await Sales.findByIdAndUpdate(
            id,
            { $set: allowedUpdate },
            { new: true, runValidators: true }
        ).populate({
            path: "staffId", select: "fullname -_id"
        }).populate({
            path: "items.product",
            select: "name price"
        });

        if (!sale) {
            res.status(404).json({ message: "Sale not found" })
            return;
        }
        res.status(200).json({ message: "Sale updated successfully", sale })
    } catch (error) {
        res.status(500).json({ message: "Error updating sale", error: error instanceof Error ? error.message : "Unknown error" })
    }
}

export const deleteSale = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        if (!id) {
            res.status(400).json({ message: "Please provide the sale ID" })
            return;
        }
        const sale = await Sales.findById(id);
        if (!sale) {
            res.status(404).json({ message: "Sale not found" })
            return;
        }

        // Restore stock for every item in the sale before deleting
        await Promise.all(
            sale.items.map(async (item) => {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { quantityLeft: item.quantity },
                });
            })
        );

        await sale.deleteOne();
        res.status(200).json({ message: "Sale deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: "Error deleting sale", error: error instanceof Error ? error.message : "Unknown error" })
    }
}

export const searchSalesByCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name } = req.query;
        if (!name || typeof name !== "string") {
            res.status(400).json({ message: "Please provide a customer name to search" });
            return;
        }

        const sales = await Sales.find({
            customerName: { $regex: name, $options: "i" }
        }).populate({
            path: "staffId", select: "fullname -_id"
        }).populate({
            path: "items.product",
            select: "name price"
        }).lean();

        res.status(200).json({ message: "Sales retrieved successfully", count: sales.length, sales });
    } catch (error) {
        res.status(500).json({ message: "Error searching sales", error: error instanceof Error ? error.message : "Unknown error" });
    }
};

export const getDailySales = async (req: Request, res: Response): Promise<void> => {
    try {
        const { date, staffId } = req.query;

        if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            res.status(400).json({ message: "Please provide a valid date as YYYY-MM-DD" });
            return;
        }

        const query: any = {};
        if (staffId && typeof staffId === "string" && isValidObjectId(staffId)) {
            query.staffId = staffId;
        }

        const startOfDayUtc = new Date(`${date}T00:00:00.000Z`);
        if (Number.isNaN(startOfDayUtc.getTime())) {
            res.status(400).json({ message: "Invalid date format" });
            return;
        }
        const endOfDayUtc = new Date(startOfDayUtc);
        endOfDayUtc.setUTCDate(endOfDayUtc.getUTCDate() + 1);

        const sales = await Sales.find({
            ...query,
            createdAt: { $gte: startOfDayUtc, $lt: endOfDayUtc },
        }).populate({
            path: "staffId", select: "fullname StaffId -_id"
        }).populate({
            path: "items.product",
            select: "name price"
        }).lean();

        const totalSales = sales.length;
        const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

        res.status(200).json({
            message: query.staffId ? "Staff daily sales retrieved successfully" : "All staff daily sales retrieved successfully",
            date,
            staffId: query.staffId || "All",
            totalSales,
            totalAmount,
            sales,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error retrieving daily sales",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export const getEndOfDaySales = async (req: Request, res: Response): Promise<void> => {
    try {
        const { date } = req.query;
        let targetDate = date;
        if (!targetDate) {
            targetDate = new Date().toISOString().split("T")[0]; // Default to today
        }

        if (typeof targetDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
            res.status(400).json({ message: "Please provide date as YYYY-MM-DD" });
            return;
        }

        const startOfDayUtc = new Date(`${targetDate}T00:00:00.000Z`);
        if (Number.isNaN(startOfDayUtc.getTime())) {
            res.status(400).json({ message: "Invalid date" });
            return;
        }
        const endOfDayUtc = new Date(startOfDayUtc);
        endOfDayUtc.setUTCDate(endOfDayUtc.getUTCDate() + 1);

        const [summary] = await Sales.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfDayUtc, $lt: endOfDayUtc },
                },
            },
            {
                $facet: {
                    totals: [
                        {
                            $group: {
                                _id: null,
                                grossSales: { $sum: "$totalAmount" },
                                count: { $sum: 1 },
                            },
                        },
                    ],
                    paymentStatus: [
                        {
                            $group: {
                                _id: "$isPaid",
                                count: { $sum: 1 },
                                amount: { $sum: "$totalAmount" },
                            },
                        },
                    ],
                    paymentMethods: [
                        {
                            $group: {
                                _id: "$paymentMethod",
                                count: { $sum: 1 },
                                amount: { $sum: "$totalAmount" },
                            },
                        },
                    ],
                },
            },
        ]);

        const totals = summary?.totals?.[0] || { grossSales: 0, count: 0 };
        const paidRow = (summary?.paymentStatus || []).find((row: { _id: boolean }) => row._id === true);
        const unpaidRow = (summary?.paymentStatus || []).find((row: { _id: boolean }) => row._id === false);
        const methods = summary?.paymentMethods || [];

        const paymentMethodBreakdown = {
            Cash: { count: 0, amount: 0 },
            Transfer: { count: 0, amount: 0 },
            Pos: { count: 0, amount: 0 },
        };

        methods.forEach((row: { _id: "Cash" | "Transfer" | "Pos"; count: number; amount: number }) => {
            if (row._id && paymentMethodBreakdown[row._id]) {
                paymentMethodBreakdown[row._id] = {
                    count: row.count,
                    amount: row.amount,
                };
            }
        });

        res.status(200).json({
            message: "End of day sales retrieved successfully",
            date: targetDate,
            window: {
                startUtc: startOfDayUtc.toISOString(),
                endUtc: endOfDayUtc.toISOString(),
            },
            grossSales: totals.grossSales,
            count: totals.count,
            paid: {
                count: paidRow?.count || 0,
                amount: paidRow?.amount || 0,
            },
            unpaid: {
                count: unpaidRow?.count || 0,
                amount: unpaidRow?.amount || 0,
            },
            paymentMethodBreakdown,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error retrieving end of day sales",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

const buildSaleReceiptData = async (id: string): Promise<ReceiptData | null> => {
    const sale = await Sales.findById(id).populate({
        path: "staffId",
        select: "fullname StaffId -_id"
    }).populate({
        path: "items.product",
        select: "name price"
    }).lean();

    if (!sale) {
        return null;
    }

    const staff = sale.staffId as unknown as { fullname?: string; StaffId?: string } | null;
    return {
        storeName: process.env.STORE_NAME || "Stedad",
        saleId: sale.salesId,
        printedAt: new Date(sale.createdAt).toLocaleString("en-NG", {
            timeZone: "Africa/Lagos",
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }),
        customerName: sale.customerName,
        staffName: staff?.fullname || "N/A",
        staffCode: staff?.StaffId || "N/A",
        paymentMethod: sale.paymentMethod,
        isPaid: sale.isPaid,
        totalAmount: sale.totalAmount,
        items: sale.items.map((item) => {
            const product = item.product as unknown as { name?: string; price?: number };
            const unitPrice = typeof item.price === "number" ? item.price : (product?.price || 0);
            return {
                name: product?.name || "Product",
                quantity: item.quantity,
                unitPrice,
            };
        }),
    };
};

export const getSaleReceipt = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = toParamString(req.params.id);
        if (!id || !isValidObjectId(id)) {
            res.status(400).json({ message: "Please provide a valid sale ID" });
            return;
        }

        const receipt = await buildSaleReceiptData(id);
        if (!receipt) {
            res.status(404).json({ message: "Sale not found" });
            return;
        }

        const itemRows = receipt.items.map((item) => {
            const lineTotal = item.quantity * item.unitPrice;
            return `
                <tr>
                    <td>${escapeHtml(item.name)}</td>
                    <td class="num">${item.quantity}</td>
                    <td class="num">NGN ${item.unitPrice.toFixed(2)}</td>
                    <td class="num">NGN ${lineTotal.toFixed(2)}</td>
                </tr>
            `;
        }).join("");

        const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Receipt ${escapeHtml(receipt.saleId)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: #fff; color: #111; }
    .receipt { width: 320px; margin: 12px auto; padding: 12px; border: 1px dashed #999; }
    h1 { font-size: 18px; margin: 0 0 4px; text-align: center; }
    .meta { font-size: 12px; margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { font-size: 12px; padding: 4px 0; border-bottom: 1px dotted #ddd; }
    .num { text-align: right; }
    .totals { margin-top: 10px; font-size: 13px; }
    .totals p { margin: 4px 0; display: flex; justify-content: space-between; }
    .strong { font-weight: 700; }
    .footer { margin-top: 12px; text-align: center; font-size: 11px; color: #555; }
    @media print {
      .receipt { border: none; margin: 0; width: 100%; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <h1>${escapeHtml(receipt.storeName)}</h1>
    <p class="meta">Receipt: ${escapeHtml(receipt.saleId)}</p>
    <p class="meta">Date: ${escapeHtml(receipt.printedAt)}</p>
    <p class="meta">Customer: ${escapeHtml(receipt.customerName)}</p>
    <p class="meta">Staff: ${escapeHtml(receipt.staffName)} (${escapeHtml(receipt.staffCode)})</p>
    <p class="meta">Payment: ${escapeHtml(receipt.paymentMethod)} | ${receipt.isPaid ? "Paid" : "Unpaid"}</p>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="num">Qty</th>
          <th class="num">Unit</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div class="totals">
      <p class="strong"><span>Grand Total</span><span>NGN ${receipt.totalAmount.toFixed(2)}</span></p>
    </div>

    <p class="footer">Thank you for your purchase.</p>
  </div>
</body>
</html>`;

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.status(200).send(html);
    } catch (error) {
        res.status(500).json({
            message: "Error generating receipt",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export const printSaleReceipt = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = toParamString(req.params.id);
        if (!id || !isValidObjectId(id)) {
            res.status(400).json({ message: "Please provide a valid sale ID" });
            return;
        }

        const receipt = await buildSaleReceiptData(id);
        if (!receipt) {
            res.status(404).json({ message: "Sale not found" });
            return;
        }

        await printReceipt(receipt);
        res.status(200).json({ message: "Receipt printed successfully", saleId: receipt.saleId });
    } catch (error) {
        res.status(500).json({
            message: "Error printing receipt",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
