import Customer, { Icustomer } from "../models/customerModel";
import { Request, Response } from "express";
import Sale from "../models/salesModel";
import mongoose from "mongoose";


interface CustomerSalesSummary {
    _id: mongoose.Types.ObjectId;
    purchaseCount: number;
    lastPurchase: Date;
}

export const getAllCustomers = async (req: Request, res: Response): Promise<void> => {
    try {
        const customers = await Customer.find()
        res.status(200).json({ message: "Customers successfully retrieved", customers })
    } catch (error) {
        res.status(500).json({ message: "error retrieving users", error })
    }
}

export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        const customer: Icustomer | null = await Customer.findById(id)
        if (!customer) {
            res.status(404).json({ message: "Customer Doesnt exist" })
            return;
        }
        const sales = await Sale.find({ customer: customer._id })
            .sort({ createdAt: -1 });
        res.status(200).json({ message: "Customer  successfully retrieved", customer, sales })
    } catch (error) {
        res.status(500).json({ message: "error retrieving customer", error })
    }
}

export const createCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, phone } = req.body
        const customer = new Customer({ name, phone })
        await customer.save()
        res.status(201).json({ message: "user created successfully" })
    } catch (error) {
        res.status(500).json({ message: "error retrieving user", error })
    }
}

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        if (!id) { res.status(400).json({ message: "please provide the customeriD" }) }
        const customer = await Customer.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        )
        if (!customer) {
            res.status(404).json({ message: "customer not found" })
        }
        res.status(200).json({
            message: "Customer updated successfully",
            customer,
        });
    } catch (error) {
        res.status(500).json({ message: "error updating user", error })

    }
}

export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        const customer = await Customer.findByIdAndDelete(id)
        if (!customer) {
            res.status(404).json("customer not found")
        }
res.status(200).json({ message: "Customer deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "error updating user", error })

    }
}




export const searchCustomerSales = async (
    req: Request,
    res: Response
) => {
    try {
        const { search } = req.query;
        if (typeof search !== 'string' || !search) {
            return res.status(400).json({ message: "Search query is required" });
        }


        // 1️⃣ Find customer
        const customer = await Customer.findOne({
            $or: [
                { name: { $regex: search, $options: "i" } },
            ],
        });

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        // 2️⃣ Fetch sales (optional but useful)
        const sales = await Sale.find({ customer: customer._id })
            .sort({ createdAt: -1 });

        // 3️⃣ Aggregate purchase count + last purchase
        const result: CustomerSalesSummary[] = await Sale.aggregate([
            {
                $match: {
                    customer: new mongoose.Types.ObjectId(customer._id),
                },
            },
            {
                $group: {
                    _id: "$customer",
                    purchaseCount: { $sum: 1 },
                    lastPurchase: { $max: "$createdAt" },
                },
            },
        ]);

        return res.status(200).json({
            customer,
            sales,
            purchaseCount: result[0]?.purchaseCount ?? 0,
            lastPurchase: result[0]?.lastPurchase ?? null,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch customer purchase count",
        });
    }
};

