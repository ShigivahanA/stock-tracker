// server/routes/auth.js
import express from "express";
import User from "../models/User.js";

const router = express.Router();

/**
 * 🛠️ Create admin user (only via Postman)
 * POST /api/auth/create-admin
 * Body: { username, password }
 */
router.post("/create-admin", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "username and password required" });

    const existing = await User.findOne({ username });
    if (existing)
      return res
        .status(400)
        .json({ error: "User already exists. Only one admin allowed." });

    const passwordHash = await User.hashPassword(password);
    const user = new User({ username, passwordHash });
    await user.save();

    res.status(201).json({ message: "Admin user created successfully." });
  } catch (err) {
    console.error("Admin creation failed:", err);
    res.status(500).json({ error: "Failed to create admin user" });
  }
});

/**
 * 🔐 Login (for frontend)
 * POST /api/auth/login
 * Body: { username, password }
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    // Simple token (for single-user local setup)
    const token = Buffer.from(`${username}:${Date.now()}`).toString("base64");
    res.json({ token });
  } catch (err) {
    console.error("Login failed:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
