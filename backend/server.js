import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Razorpay from "razorpay";

import connectDB from "./database/connect.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminAuthRoutes from "./routes/adminAuth.js";

dotenv.config();

// Initialize App
const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Razorpay Instance
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Routes
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);          // admin dashboard data API
app.use("/api/admin/auth", adminAuthRoutes); // admin login authentication

// Health Check
app.get("/", (req, res) => {
  res.status(200).json({ message: "Avesham Season 2 Backend Running Successfully" });
});

// Server Listener
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
