import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./database/connect.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminAuthRoutes from "./routes/adminAuth.js";
import publicRoutes from "./routes/publicRoutes.js";

dotenv.config();

// Initialize App
const app = express();

// Get directory paths for serving static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from dist directory (React build)
app.use(express.static(path.join(__dirname, "../dist")));

// Connect to MongoDB
connectDB();

// Razorpay Instance
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Debug: Log all incoming requests (remove in production if needed)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Route Groups - Register more specific routes first
app.use("/api/payment", paymentRoutes);
app.use("/api/public", publicRoutes);            // public endpoint for pricing
app.use("/api/admin/auth", adminAuthRoutes);     // login for admin panel (MUST be before /api/admin)
app.use("/api/admin", adminRoutes);              // admin dashboard + pricing update

// Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Avesham Season 2 Backend Running Successfully",
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler for API routes - must be after all API routes
app.use("/api/*", (req, res) => {
  console.log(`404 - API route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    status: "error",
    message: "Route not found",
    path: req.path,
    method: req.method
  });
});

// Serve React app for all non-API routes (SPA fallback) - only for GET requests
app.get("*", (req, res) => {
  // Don't serve HTML for API routes
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      status: "error",
      message: "Route not found",
      path: req.path
    });
  }
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// Global Error Handler - must be last
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Server Listener
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
