import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    phone: String,
    ticketType: String,
    quantity: Number,
    totalAmount: Number,
    paymentId: String,
    serialNumber: { type: String, unique: true },
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("Booking", bookingSchema);
