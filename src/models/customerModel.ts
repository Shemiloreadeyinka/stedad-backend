import { Document, model, Schema } from "mongoose";

export interface Icustomer extends Document{
    name: string
    phone?:string
    totalSpent:number
    createdAt:Date
}

const customerSchema=new Schema<Icustomer>({
    name:{type:String,required:true},
    phone:{type:String,unique:true},
    totalSpent:{type:Number, default:0}
},{timestamps:true})

const Customer= model<Icustomer>("Customer",customerSchema)
export default Customer