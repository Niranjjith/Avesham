import express from "express";
import crypto from "crypto";
import { razorpay } from "../server.js";
import Booking from "../models/Booking.js";
import sendTicketMail from "../utils/sendMail.js";
import generateTicketPDF from "../utils/generateTicketPDF.js";

const router = express.Router();

// CREATE Razorpay Order
router.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100, // convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    console.error("Order create error:", error);
    res.status(500).json({ message: "Order creation failed" });
  }
});

// VERIFY Razorpay Payment
router.post("/verify-payment", async (req, res) => {
  try {
    const {
      order_id,
      payment_id,
      signature,
      fullName,
      email,
      phone,
      selectedTicketType,
      quantity,
      totalAmount
    } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${order_id}|${payment_id}`)
      .digest("hex");

    if (generatedSignature !== signature) {
      console.log("Payment verification failed: Signature mismatch");
      return res.status(400).json({ status: "failed" });
    }

    // Generate unique serial
    const serialNumber =
      `AVS2-${Date.now().toString().slice(-6)}${Math.random()
        .toString(36)
        .substring(2, 5)
        .toUpperCase()}`;

    // Normalize ticket type (day-pass -> Day Pass, season-pass -> Season Pass)
    const normalizedTicketType = selectedTicketType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Save booking to DB
    const booking = await Booking.create({
      fullName,
      email,
      phone,
      ticketType: normalizedTicketType,
      quantity,
      totalAmount,
      paymentId: payment_id,
      serialNumber
    });

    // Generate download URL for ticket PDF
    const baseUrl = process.env.BASE_URL || `http://${req.get('host')}`;
    const downloadUrl = `${baseUrl}/api/public/download-ticket/${serialNumber}`;

    // Send simple confirmation email (without PDF)
    try {
      await sendTicketMail(
        email,
        fullName,
        serialNumber,
        normalizedTicketType,
        quantity,
        payment_id,
        downloadUrl
      );
    } catch (emailError) {
      console.error("Email sending error (non-critical):", emailError);
      // Don't fail the payment if email fails
    }

    res.json({ 
      status: "success", 
      booking,
      downloadUrl // Send download URL instead of base64 PDF
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ status: "error" });
  }
});

export default router;
