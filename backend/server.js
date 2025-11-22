import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import connectDB from "./database/connect.js";
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config();

// Connect to MongoDB
connectDB();

// Init App
const app = express();
app.use(cors());
app.use(express.json()); // replaces body-parser

// Razorpay instance (export for routes)
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Routes
app.use("/api/payment", paymentRoutes);

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Avesham Season 2 Backend Running" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
