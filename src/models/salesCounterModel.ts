import mongoose from "mongoose";



const salesCounterSchema = new mongoose.Schema({
    date: {
        type: String, // format: MMDD
        required: true,
        unique: true,
    },
    seq: {
        type: Number,
        default: 0,
    },
});

export default mongoose.model("SalesCounter", salesCounterSchema);
