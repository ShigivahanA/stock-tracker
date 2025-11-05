import express from "express";
import Entry from "../models/Entry.js";
import Stock from "../models/Stock.js";

const router = express.Router();

/**
 * 🕓 Helper: Returns today's date in IST (YYYY-MM-DD)
 */
function getISTDateString() {
  const nowUTC = new Date();
  const nowIST = new Date(nowUTC.getTime() + 5.5 * 60 * 60 * 1000);
  const yyyy = nowIST.getUTCFullYear();
  const mm = String(nowIST.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(nowIST.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * 🟢 POST: Create or update an entry
 * Body: { stockId, unitPrice, totalValue, date?, remarks? }
 */
router.post("/", async (req, res) => {
  try {
    const { stockId, unitPrice, totalValue, remarks, date } = req.body;

    if (!stockId || unitPrice == null || totalValue == null) {
      return res
        .status(400)
        .json({ error: "stockId, unitPrice, and totalValue are required." });
    }

    // ✅ Use user-selected date or fallback to today's date
    const dateStr = date
      ? new Date(date).toISOString().slice(0, 10)
      : getISTDateString();

    const stock = await Stock.findById(stockId);
    if (!stock) {
      return res.status(404).json({ error: "Stock not found." });
    }

    // 🧩 Prevent duplicates (one entry per date per stock)
    const existing = await Entry.findOne({ stockId, date: dateStr });
    if (existing) {
      return res.status(409).json({
        error: `Entry already exists for ${stock.name} on ${dateStr}.`,
        existing,
      });
    }

    // ✅ Save new entry
    const entry = await Entry.create({
      stockId,
      date: dateStr,
      unitPrice,
      totalValue,
      remarks,
    });

    res.status(201).json(entry);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: "Duplicate entry for this stock and date.",
        details: err.keyValue,
      });
    }
    console.error("❌ Failed to create entry:", err);
    res.status(500).json({
      error: "Failed to create entry.",
      details: err.message,
    });
  }
});

/**
 * 📘 GET: All entries (optional filters: ?stockId=&date=)
 */
router.get("/", async (req, res) => {
  try {
    const { stockId, date } = req.query;
    const query = {};
    if (stockId) query.stockId = stockId;
    if (date) query.date = date;

    const entries = await Entry.find(query)
      .sort({ date: -1, createdAt: -1 })
      .populate("stockId");

    res.json(entries);
  } catch (err) {
    console.error("❌ Failed to fetch entries:", err);
    res.status(500).json({ error: "Failed to fetch entries." });
  }
});

/**
 * 🕒 GET: Latest entry per stock
 */
router.get("/latest", async (req, res) => {
  try {
    const latest = await Entry.aggregate([
      { $sort: { date: -1, createdAt: -1 } },
      {
        $group: {
          _id: "$stockId",
          entryId: { $first: "$_id" },
          date: { $first: "$date" },
          unitPrice: { $first: "$unitPrice" },
          totalValue: { $first: "$totalValue" },
          createdAt: { $first: "$createdAt" },
        },
      },
    ]);

    const populated = await Promise.all(
      latest.map(async (l) => {
        const stock = await Stock.findById(l._id).lean();
        return { stock, ...l };
      })
    );

    res.json(populated);
  } catch (err) {
    console.error("❌ Failed to fetch latest entries:", err);
    res.status(500).json({ error: "Failed to fetch latest entries." });
  }
});

/**
 * 📊 GET: Analytics — history of one stock (sorted oldest→newest)
 */
router.get("/analytics/:stockId", async (req, res) => {
  try {
    const { stockId } = req.params;
    const entries = await Entry.find({ stockId })
      .sort({ date: 1 })
      .lean();

    res.json(entries);
  } catch (err) {
    console.error("❌ Failed to fetch analytics:", err);
    res.status(500).json({ error: "Failed to fetch analytics." });
  }
});

export default router;
