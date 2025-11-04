// server/routes/entryRoutes.js
import express from "express";
import Entry from "../models/Entry.js";
import Stock from "../models/Stock.js";

const router = express.Router();

/**
 * Helper: get IST date string and auto type
 */
function getISTDateAndAutoType() {
  const now = new Date();
  const parts = now.toLocaleString("en-GB", { timeZone: "Asia/Kolkata" });
  const [datePart] = parts.split(",");
  const [dd, mm, yyyy] = datePart.split("/");
  const dateStr = `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;

  // 🔧 TEST MODE: alternate automatically between open and close every call
  const currentMinutes = now.getMinutes();
  const autoType = currentMinutes % 2 === 0 ? "open" : "close";

  return { dateStr, autoType, hour: now.getHours(), minute: now.getMinutes() };
}

// POST create entry
// body: { stockId, unitPrice, totalValue, remarks?, force?: boolean, type?: 'open'|'close'|'manual' }
router.post("/", async (req, res) => {
  try {
    const { stockId, unitPrice, totalValue, remarks } = req.body;
    let { force = false, type: requestedType } = req.body;

    if (!stockId || unitPrice == null || totalValue == null)
      return res.status(400).json({ error: "stockId, unitPrice and totalValue required" });

    // make sure stock exists
    const stock = await Stock.findById(stockId);
    if (!stock) return res.status(404).json({ error: "Stock not found" });

    const { dateStr, autoType } = getISTDateAndAutoType();

    // decide type
    let type = requestedType || autoType;
    // if type is out-of-window and no force provided, return a helpful message
    if (type === "out-of-window" && !force && !requestedType) {
      return res.status(400).json({
        error: "Outside auto-entry windows. Use 'force: true' to override with server-side date/type.",
        suggested: {
          autoType,
          info: "Auto-type picks 'open' between 09:15-12:00 IST and 'close' from 15:30 IST onwards."
        }
      });
    }

    // if requestedType was provided by client (explicit), accept that (but still set date to IST)
    if (requestedType && ["open", "close", "manual"].includes(requestedType)) {
      type = requestedType;
    } else if (autoType === "out-of-window" && force) {
      // if forced but no requestedType, mark as manual to indicate it's forced outside windows
      type = "manual";
    }

    // Check existing entry for same stock/date/type
    const existing = await Entry.findOne({ stockId, date: dateStr, type });

    if (existing && !force) {
      return res.status(409).json({
        error: "Entry already exists for this stock/date/type. Use force=true to overwrite.",
        existing
      });
    }

    if (existing && force) {
      // overwrite
      existing.unitPrice = unitPrice;
      existing.totalValue = totalValue;
      existing.remarks = remarks;
      await existing.save();
      return res.json({ message: "Entry updated (forced)", entry: existing });
    }

    const entry = new Entry({
      stockId, date: dateStr, type, unitPrice, totalValue, remarks
    });
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    // handle duplicate key error specially (unique index)
    if (err.code === 11000) {
      return res.status(409).json({ error: "Duplicate entry (stock/date/type).", details: err.keyValue });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to create entry", details: err.message });
  }
});

// GET all entries (optionally filter by stockId or date)
router.get("/", async (req, res) => {
  try {
    const { stockId, date } = req.query;
    const q = {};
    if (stockId) q.stockId = stockId;
    if (date) q.date = date;
    const entries = await Entry.find(q).sort({ date: -1, createdAt: -1 }).populate("stockId");
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

// GET latest entry per stock
router.get("/latest", async (req, res) => {
  try {
    // aggregation: for each stockId, get latest by date+createdAt
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
          createdAt: { $first: "$createdAt" }
        }
      }
    ]);
    // populate stock info
    const populated = await Promise.all(latest.map(async l => {
      const stock = await Stock.findById(l._id).lean();
      return { stock, ...l };
    }));
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch latest entries" });
  }
});

// GET analytics for a stock (history)
router.get("/analytics/:stockId", async (req, res) => {
  try {
    const { stockId } = req.params;
    const entries = await Entry.find({ stockId }).sort({ date: 1, type: 1 }).lean();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

export default router;
