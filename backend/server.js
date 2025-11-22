import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import paymentRoutes from "./routes/paymentRoutes.js";
import connectDB from "./database/connect.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(bodyParser.json());

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

app.use("/api/payment", paymentRoutes);

app.listen(5000, () => console.log("Backend running on port 5000"));
