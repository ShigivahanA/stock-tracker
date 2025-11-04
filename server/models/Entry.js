// server/models/Entry.js
import mongoose from "mongoose";

const entrySchema = new mongoose.Schema(
  {
    stockId: { type: mongoose.Schema.Types.ObjectId, ref: "Stock", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD (IST)
    type: { type: String, enum: ["open", "close", "manual"], required: true },
    unitPrice: { type: Number, required: true },
    totalValue: { type: Number, required: true }, // your manually-entered total portfolio value at that moment
    remarks: String,
  },
  { timestamps: true }
);

entrySchema.index({ stockId: 1, date: 1, type: 1 }, { unique: true }); // prevents duplicates by default

export default mongoose.model("Entry", entrySchema);
