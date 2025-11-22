import express from "express";
import jwt from "jsonwebtoken";
import Booking from "../models/Booking.js";
import Pricing from "../models/Pricing.js";
import generateTicketPDF from "../utils/generateTicketPDF.js";

const router = express.Router();

// Test route to verify admin routes are working
router.get("/test", (req, res) => {
    res.json({ 
        status: "success", 
        message: "Admin routes are working",
        timestamp: new Date().toISOString()
    });
});

// Middleware: Verify Admin Token
function verifyAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(403).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token)
        return res.status(403).json({ message: "Token missing" });

    try {
        jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
}

// GET All Bookings + Pricing
router.get("/bookings", verifyAdmin, async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ timestamp: -1 });

        const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
        const totalTickets = bookings.reduce((sum, b) => sum + b.quantity, 0);

        const dayPassRevenue = bookings
            .filter(b => {
                const type = b.ticketType.toLowerCase();
                return type === "day pass" || type === "day-pass";
            })
            .reduce((sum, b) => sum + b.totalAmount, 0);

        const seasonPassRevenue = bookings
            .filter(b => {
                const type = b.ticketType.toLowerCase();
                return type === "season pass" || type === "season-pass";
            })
            .reduce((sum, b) => sum + b.totalAmount, 0);

        const prices = await Pricing.findOne({}) || { dayPass: 199, seasonPass: 699 };

        res.json({
            status: "success",
            totalRevenue,
            totalTickets,
            dayPassRevenue,
            seasonPassRevenue,
            totalBookings: bookings.length,
            bookings,
            prices
        });

    } catch (err) {
        console.error("Admin fetch error:", err);
        res.status(500).json({ status: "error", message: "Failed to load bookings" });
    }
});

// UPDATE PRICES
router.post("/update-prices", verifyAdmin, async (req, res) => {
    try {
        console.log("=== UPDATE PRICES ROUTE HIT ===");
        console.log("Request body:", req.body);
        console.log("Request headers:", req.headers);
        
        const { dayPass, seasonPass } = req.body;

        console.log("Update prices request:", { dayPass, seasonPass });

        // Validate input
        if (dayPass === undefined || seasonPass === undefined) {
            return res.status(400).json({ 
                status: "error", 
                message: "Both dayPass and seasonPass are required" 
            });
        }

        if (typeof dayPass !== 'number' || typeof seasonPass !== 'number') {
            return res.status(400).json({ 
                status: "error", 
                message: "Prices must be numbers" 
            });
        }

        if (dayPass <= 0 || seasonPass <= 0) {
            return res.status(400).json({ 
                status: "error", 
                message: "Prices must be positive numbers" 
            });
        }

        // Update or create pricing document
        const updatedPricing = await Pricing.findOneAndUpdate(
            {},
            { dayPass, seasonPass },
            { 
                upsert: true, 
                new: true,
                setDefaultsOnInsert: true
            }
        );

        console.log("Prices updated successfully:", updatedPricing);

        res.json({ 
            status: "success",
            message: "Prices updated successfully",
            prices: {
                dayPass: updatedPricing.dayPass,
                seasonPass: updatedPricing.seasonPass
            }
        });

    } catch (err) {
        console.error("Update Prices Error:", err);
        res.status(500).json({ 
            status: "error", 
            message: err.message || "Failed to update prices",
            error: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// DOWNLOAD TICKET PDF
router.get("/download-ticket/:serialNumber", verifyAdmin, async (req, res) => {
    try {
        const { serialNumber } = req.params;

        const booking = await Booking.findOne({ serialNumber });

        if (!booking) {
            return res.status(404).json({ 
                status: "error", 
                message: "Booking not found" 
            });
        }

        // Generate PDF
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
        console.error("PDF Generation Error:", err);
        res.status(500).json({ 
            status: "error", 
            message: "Failed to generate PDF" 
        });
    }
});

// VERIFY QR CODE
router.post("/verify-qr", verifyAdmin, async (req, res) => {
    try {
        const { qrData } = req.body;

        if (!qrData) {
            return res.status(400).json({ 
                status: "error", 
                message: "QR data is required" 
            });
        }

        let parsedData;
        try {
            parsedData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
        } catch (parseError) {
            return res.status(400).json({ 
                status: "error", 
                message: "Invalid QR code format" 
            });
        }

        const { serialNumber, paymentId } = parsedData;

        if (!serialNumber) {
            return res.status(400).json({ 
                status: "error", 
                message: "Serial number not found in QR code" 
            });
        }

        // Find booking by serial number
        const booking = await Booking.findOne({ serialNumber });

        if (!booking) {
            return res.json({ 
                status: "invalid", 
                message: "Ticket not found. Invalid serial number." 
            });
        }

        // Verify payment ID matches (if provided in QR)
        if (paymentId && booking.paymentId !== paymentId) {
            return res.json({ 
                status: "invalid", 
                message: "Payment ID mismatch. Ticket may be tampered." 
            });
        }

        // Return booking details
        res.json({
            status: "valid",
            message: "Ticket verified successfully",
            booking: {
                serialNumber: booking.serialNumber,
                fullName: booking.fullName,
                email: booking.email,
                phone: booking.phone,
                ticketType: booking.ticketType,
                quantity: booking.quantity,
                totalAmount: booking.totalAmount,
                paymentId: booking.paymentId,
                timestamp: booking.timestamp
            }
        });

    } catch (err) {
        console.error("QR Verification Error:", err);
        res.status(500).json({ 
            status: "error", 
            message: "Failed to verify QR code" 
        });
    }
});

export default router;
