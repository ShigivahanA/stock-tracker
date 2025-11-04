// server/server.js
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

// MongoDB connect
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// routes
app.use("/api/stocks", stockRoutes);
app.use("/api/entries", entryRoutes);
app.use("/api/auth", authRoutes);


app.get("/", (req, res) => res.send("Stock tracker API running"));

app.listen(PORT, () => console.log(`🚀 Server listening on ${PORT}`));
