import { Document, model, Schema, Types } from "mongoose";
import Staff from "./staffModel";
import Customer from "../models/customerModel";


export interface Isale extends Document {
    salesId: string
    staffId: Types.ObjectId
    items: {
        product: Types.ObjectId;
        quantity: number;
        price: number;
    }[];
    customerName: string

    totalAmount: number
    paymentMethod: { method: "Transfer" | "Cash" | "POS", amount: number }[]
    isPaid: boolean
    createdAt: Date
}
const saleItemSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    price: {
        type: Number, // price per unit at time of sale
        required: true,
        min: 0,
    },
});

const salesSchema = new Schema<Isale>({
    salesId: { type: String, required: true, unique: true },
    staffId: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
    items: [{ type: saleItemSchema, required: true }],
    customerName: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    paymentMethod: [
        {
            method: { type: String, enum: ["Transfer", "Cash", "POS"], required: true },
            amount: { type: Number, required: true, min: 0 }
        }
    ],
    isPaid: { type: Boolean, required: true },
}, { timestamps: true })


const Sales = model<Isale>("sales", salesSchema)
export default Sales