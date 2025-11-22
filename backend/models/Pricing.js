import mongoose from "mongoose";

const PricingSchema = new mongoose.Schema({
    dayPass: { type: Number, required: true, default: 199 },
    seasonPass: { type: Number, required: true, default: 699 }
});

export default mongoose.model("Pricing", PricingSchema);
