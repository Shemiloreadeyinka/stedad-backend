export interface ReceiptItem {
    name: string;
    quantity: number;
    unitPrice: number;
}

export interface ReceiptData {
    storeName: string;
    saleId: string;
    printedAt: string;
    customerName: string;
    staffName: string;
    staffCode: string;
    paymentMethod: string;
    isPaid: boolean;
    totalAmount: number;
    items: ReceiptItem[];
}

export const buildReceiptHeader = (receipt: ReceiptData): string[] => {
    const status = receipt.isPaid ? "PAID" : "UNPAID";
    return [
        receipt.storeName,
        `Receipt: ${receipt.saleId}`,
        `Date: ${receipt.printedAt}`,
        `Customer: ${receipt.customerName}`,
        `Staff: ${receipt.staffName} (${receipt.staffCode})`,
        `Payment: ${receipt.paymentMethod} | ${status}`,
    ];
};

export const buildReceiptFooter = (receipt: ReceiptData): string[] => {
    return [
        `TOTAL: NGN ${receipt.totalAmount.toFixed(2)}`,
        "Thank you for your purchase.",
    ];
};
