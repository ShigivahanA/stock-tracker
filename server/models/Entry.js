import mongoose from "mongoose";

const entrySchema = new mongoose.Schema(
  {
    stockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
      required: true,
    },
    date: {
      type: String,
      required: true, // format: YYYY-MM-DD (IST)
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalValue: {
      type: Number,
      required: true,
      min: 0,
      comment: "Total portfolio value for that stock on the given date",
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

/**
 * 🔒 Unique constraint:
 * Prevents multiple entries for the same stock on the same date
 */
entrySchema.index({ stockId: 1, date: 1 }, { unique: true });

export default mongoose.model("Entry", entrySchema);
