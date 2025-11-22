import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },
    ticketType: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    paymentId: {
      type: String,
      required: true,
      unique: true
    },
    serialNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { versionKey: false }
);

export default mongoose.model("Booking", bookingSchema);
