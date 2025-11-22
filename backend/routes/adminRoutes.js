import express from "express";
import jwt from "jsonwebtoken";
import Booking from "../models/Booking.js";

const router = express.Router();

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

// GET All Bookings for Admin Dashboard
router.get("/bookings", verifyAdmin, async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ timestamp: -1 });

        const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
        const totalTickets = bookings.reduce((sum, b) => sum + b.quantity, 0);

        const dayPassRevenue = bookings
            .filter(b => b.ticketType === "day-pass")
            .reduce((sum, b) => sum + b.totalAmount, 0);

        const seasonPassRevenue = bookings
            .filter(b => b.ticketType === "season-pass")
            .reduce((sum, b) => sum + b.totalAmount, 0);

        res.json({
            status: "success",
            totalRevenue,
            totalTickets,
            dayPassRevenue,
            seasonPassRevenue,
            totalBookings: bookings.length,
            bookings
        });

    } catch (err) {
        console.error("Admin fetch error:", err);
        res.status(500).json({ status: "error", message: "Failed to load bookings" });
    }
});

export default router;
