import express from "express";
import crypto from "crypto";
import { razorpay } from "../server.js";
import Booking from "../models/Booking.js";

const router = express.Router();

// Generate serial number
async function generateSerial(ticketType) {
    const prefix = ticketType === "season-pass" ? "SP" : "DP";
    const lastEntry = await Booking.findOne({ ticketType }).sort({ timestamp: -1 });

    let nextNumber = 1;
    if (lastEntry && lastEntry.serialNumber) {
        nextNumber = parseInt(lastEntry.serialNumber.split("-")[1]) + 1;
    }

    return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
}

// Create Razorpay order
router.post("/create-order", async (req, res) => {
    try {
        const { amount } = req.body;

        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: "receipt_" + Date.now(),
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (err) {
        console.error("Order Error:", err);
        res.status(500).json({ status: "error", message: "Order creation failed" });
    }
});

// Verify Razorpay signature & save booking
router.post("/verify-payment", async (req, res) => {
    try {
        const { order_id, payment_id, signature, fullName, email, phone, selectedTicketType, quantity, totalAmount } = req.body;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(order_id + "|" + payment_id)
            .digest("hex");

        if (expectedSignature !== signature) {
            console.log("Signature mismatch");
            return res.status(400).json({ status: "failed" });
        }

        const serialNumber = await generateSerial(selectedTicketType);

        const booking = await Booking.create({
            fullName,
            email,
            phone,
            ticketType: selectedTicketType,
            quantity,
            totalAmount,
            paymentId: payment_id,
            serialNumber,
        });

        res.json({ status: "success", booking });
    } catch (err) {
        console.error("Verify Error:", err);
        res.status(500).json({ status: "error" });
    }
});

export default router;
