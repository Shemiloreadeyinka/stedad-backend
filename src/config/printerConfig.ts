import { PrinterTypes } from "node-thermal-printer";

type SupportedPrinterType = "EPSON" | "STAR" | "TANCA" | "DARUMA" | "BROTHER" | "CUSTOM";

export interface PrinterConfig {
    type: PrinterTypes;
    interface: string;
    width: number;
    timeout: number;
}

const PRINTER_TYPE_MAP: Record<SupportedPrinterType, PrinterTypes> = {
    EPSON: PrinterTypes.EPSON,
    STAR: PrinterTypes.STAR,
    TANCA: PrinterTypes.TANCA,
    DARUMA: PrinterTypes.DARUMA,
    BROTHER: PrinterTypes.BROTHER,
    CUSTOM: PrinterTypes.CUSTOM,
};

export const getPrinterConfig = (): PrinterConfig => {
    const rawType = (process.env.PRINTER_TYPE || "EPSON").toUpperCase() as SupportedPrinterType;
    const type = PRINTER_TYPE_MAP[rawType] || PrinterTypes.EPSON;

    return {
        type,
        interface: process.env.PRINTER_INTERFACE || "printer:POS-58",
        width: Number(process.env.PRINTER_WIDTH || 48),
        timeout: Number(process.env.PRINTER_TIMEOUT_MS || 5000),
    };
};
