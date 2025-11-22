import express from "express";
import Pricing from "../models/Pricing.js";
import Booking from "../models/Booking.js";
import generateTicketPDF from "../utils/generateTicketPDF.js";

const router = express.Router();

// GET ticket prices
router.get("/prices", async (req, res) => {
  try {
    const prices = await Pricing.findOne({});
    
    // If no prices found in DB, return default prices
    if (!prices) {
      return res.json({ dayPass: 199, seasonPass: 699 });
    }
    
    // Ensure we have valid numbers
    const dayPass = prices.dayPass || 199;
    const seasonPass = prices.seasonPass || 699;
    
    res.json({ dayPass, seasonPass });
  } catch (err) {
    console.error("Public Price Load Error:", err);
    // Return default prices even on error so frontend can still work
    res.status(200).json({ dayPass: 199, seasonPass: 699 });
  }
});

// GET download ticket PDF (public endpoint)
router.get("/download-ticket/:serialNumber", async (req, res) => {
  try {
    const { serialNumber } = req.params;

    // Find booking by serial number
    const booking = await Booking.findOne({ serialNumber });

    if (!booking) {
      return res.status(404).json({ 
        status: "error", 
        message: "Ticket not found" 
      });
    }

    // Generate PDF on-demand
    const pdfBuffer = await generateTicketPDF({
      serialNumber: booking.serialNumber,
      fullName: booking.fullName,
      email: booking.email,
      phone: booking.phone,
      ticketType: booking.ticketType,
      quantity: booking.quantity,
      totalAmount: booking.totalAmount,
      paymentId: booking.paymentId,
      timestamp: booking.timestamp
    });

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Avesham_Ticket_${serialNumber}.pdf"`);
    res.send(pdfBuffer);

  } catch (err) {
    console.error("Ticket Download Error:", err);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to generate ticket PDF" 
    });
  }
});

export default router;
