// server/routes/stockRoutes.js
import express from "express";
import Stock from "../models/Stock.js";

const router = express.Router();

// GET all
router.get("/", async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ createdAt: -1 });
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stocks" });
  }
});

// POST create
router.post("/", async (req, res) => {
  try {
    const { symbol, name, units = 0, notes } = req.body;
    const stock = new Stock({ symbol, name, units, notes });
    await stock.save();
    res.status(201).json(stock);
  } catch (err) {
    res.status(400).json({ error: "Failed to create stock", details: err.message });
  }
});

// optional: update units/notes
router.put("/:id", async (req, res) => {
  try {
    const updated = await Stock.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Failed to update stock" });
  }
});

export default router;
