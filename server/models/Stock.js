// server/models/Stock.js
import mongoose from "mongoose";

const stockSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    units: { type: Number, default: 0 }, // how many units you hold
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model("Stock", stockSchema);
