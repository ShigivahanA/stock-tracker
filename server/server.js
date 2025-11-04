import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import stockRoutes from "./routes/stockRoutes.js";
import entryRoutes from "./routes/entryRoutes.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// 🧠 Mongo connection caching (Vercel-safe)
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 5,
    });
    isConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    throw err;
  }
}

// 🧩 Ensure DB connection before routes
(async () => {
  try {
    await connectDB(); // Wait until DB connects before binding routes

    app.use("/api/stocks", stockRoutes);
    app.use("/api/entries", entryRoutes);
    app.use("/api/auth", authRoutes);

    app.get("/", (req, res) => res.send("✅ Stock Tracker API running"));

    app.listen(PORT, () =>
      console.log(`🚀 Server ready on port ${PORT}`)
    );
  } catch (err) {
    console.error("💥 Fatal startup error:", err);
    process.exit(1);
  }
})();
