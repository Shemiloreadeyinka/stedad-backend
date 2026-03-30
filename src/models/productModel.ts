import { Schema, model, Document } from "mongoose";
export interface Iproduct extends Document{
    productId:string;
    name: string;
    price:number;
    quantityLeft:number;
}
const productSchema= new Schema<Iproduct>({
    productId:{type:String, required:true, unique:true},
    name:{type:String, required: true},
    price:{type:Number, required: true},
    quantityLeft:{type:Number, required: true, min: 0},


},{timestamps:true} );

const Product= model<Iproduct>("Product",productSchema);
export default Product