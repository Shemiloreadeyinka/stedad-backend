import { Document,model,Schema } from "mongoose";

 export interface Istaff extends Document{
    fullname:String
    StaffId:String
    pfp:String
    password:String
    isActive:Boolean
    role:"admin"|"manager"|"cashier"
    guarantor:string
    createdAt:Date
}

const staffSchema= new Schema<Istaff>({
    StaffId:{type:String,required:true, unique:true},
    fullname:{type:String, required: true},
    pfp:{type:String, required: true},
    password:{type:String, required: true},
    isActive:{type:Boolean, required: true},
    role:{type:String,enum:["admin","manager","cashier"], required: true},
    guarantor:{type:String},


},{
    timestamps:true
});

const Staff =  model<Istaff>("Staff",staffSchema);
export default Staff
