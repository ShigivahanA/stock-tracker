import express from "express";
import Entry from "../models/Entry.js";
import Stock from "../models/Stock.js";

const router = express.Router();

/**
 * 🔹 Helper: Get IST date, hour, minute, and determine entry type automatically.
 * Returns:
 *   - dateStr (YYYY-MM-DD)
 *   - autoType ("open", "close", or "out-of-window")
 */
function getISTDateAndAutoType() {
  const nowUTC = new Date();
  const nowIST = new Date(nowUTC.getTime() + 5.5 * 60 * 60 * 1000);

  const yyyy = nowIST.getUTCFullYear();
  const mm = String(nowIST.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(nowIST.getUTCDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  const hour = nowIST.getUTCHours();
  const minute = nowIST.getUTCMinutes();
  const totalMinutes = hour * 60 + minute;

  // NSE India: Market open 09:15–15:30 IST
  const openStart = 9 * 60 + 15;   // 09:15 AM
  const closeEnd = 15 * 60 + 30;   // 03:30 PM

  let autoType = "out-of-window";
  if (totalMinutes >= openStart && totalMinutes <= closeEnd) {
    autoType = "open";
  } else {
    autoType = "close";
  }

  return { dateStr, autoType, hour, minute };
}

/**
 * 🟢 POST: Create or update an entry
 * Body: { stockId, unitPrice, totalValue, remarks?, force?, type? }
 */
router.post("/", async (req, res) => {
  try {
    const { stockId, unitPrice, totalValue, remarks } = req.body;
    let { force = false, type: requestedType } = req.body;

    if (!stockId || unitPrice == null || totalValue == null)
      return res.status(400).json({ error: "stockId, unitPrice, and totalValue are required." });

    const stock = await Stock.findById(stockId);
    if (!stock) return res.status(404).json({ error: "Stock not found" });

    const { dateStr, autoType, hour, minute } = getISTDateAndAutoType();
    let type = requestedType || autoType;

    // Validate time window logic
    const withinOpenWindow = autoType === "open";
    const withinCloseWindow = autoType === "close";

    if (requestedType === "open" && !withinOpenWindow && !force) {
      return res.status(400).json({
        error: "Cannot record 'open' entries outside market hours (09:15–15:30 IST).",
        currentIST: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} IST`,
      });
    }

    if (requestedType === "close" && withinOpenWindow && !force) {
      return res.status(400).json({
        error: "Cannot record 'close' entries during market hours (before 15:30 IST).",
        currentIST: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} IST`,
      });
    }

    // Fallbacks for forced/manual entries
    if (requestedType && ["open", "close", "manual"].includes(requestedType)) {
      type = requestedType;
    } else if (autoType === "out-of-window" && force) {
      type = "manual";
    }

    // Prevent duplicates unless forced
    const existing = await Entry.findOne({ stockId, date: dateStr, type });
    if (existing && !force) {
      return res.status(409).json({
        error: `Entry already exists for this stock/date/type (${type}).`,
        existing,
      });
    }

    if (existing && force) {
      existing.unitPrice = unitPrice;
      existing.totalValue = totalValue;
      existing.remarks = remarks;
      await existing.save();
      return res.json({ message: "Entry updated (forced)", entry: existing });
    }

    // Save new entry
    const entry = new Entry({
      stockId,
      date: dateStr,
      type,
      unitPrice,
      totalValue,
      remarks,
    });
    await entry.save();

    res.status(201).json(entry);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: "Duplicate entry (stock/date/type).",
        details: err.keyValue,
      });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to create entry", details: err.message });
  }
});

/**
 * 📘 GET: All entries (optional filters: ?stockId=&date=)
 */
router.get("/", async (req, res) => {
  try {
    const { stockId, date } = req.query;
    const q = {};
    if (stockId) q.stockId = stockId;
    if (date) q.date = date;

    const entries = await Entry.find(q)
      .sort({ date: -1, createdAt: -1 })
      .populate("stockId");

    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch entries" });
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
          type: { $first: "$type" },
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
    res.status(500).json({ error: "Failed to fetch latest entries" });
  }
});

/**
 * 📊 GET: Analytics (history for one stock)
 */
router.get("/analytics/:stockId", async (req, res) => {
  try {
    const { stockId } = req.params;
    const entries = await Entry.find({ stockId })
      .sort({ date: 1, type: 1 })
      .lean();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

export default router;
