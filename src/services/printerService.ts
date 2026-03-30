import { ThermalPrinter } from "node-thermal-printer";
import { getPrinterConfig } from "../config/printerConfig";
import { buildReceiptFooter, buildReceiptHeader, ReceiptData } from "../templates/receiptTemplate";

const createPrinter = (): ThermalPrinter => {
    const config = getPrinterConfig();
    return new ThermalPrinter({
        type: config.type,
        interface: config.interface,
        width: config.width,
        options: {
            timeout: config.timeout,
        },
    });
};

export const printReceipt = async (receipt: ReceiptData): Promise<void> => {
    const printer = createPrinter();

    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
        throw new Error("Printer is not connected");
    }

    printer.clear();
    printer.alignCenter();
    printer.bold(true);
    printer.println(receipt.storeName);
    printer.bold(false);
    printer.newLine();

    printer.alignLeft();
    buildReceiptHeader(receipt).slice(1).forEach((line) => printer.println(line));
    printer.drawLine();

    receipt.items.forEach((item) => {
        const lineTotal = item.quantity * item.unitPrice;
        printer.tableCustom([
            { text: item.name, align: "LEFT", width: 0.5 },
            { text: `x${item.quantity}`, align: "RIGHT", width: 0.15 },
            { text: `${item.unitPrice.toFixed(2)}`, align: "RIGHT", width: 0.15 },
            { text: `${lineTotal.toFixed(2)}`, align: "RIGHT", width: 0.2 },
        ]);
    });

    printer.drawLine();
    const [totalLine, thanksLine] = buildReceiptFooter(receipt);
    printer.bold(true);
    printer.println(totalLine);
    printer.bold(false);
    printer.newLine();
    printer.alignCenter();
    printer.println(thanksLine);
    printer.cut();

    await printer.execute();
};
