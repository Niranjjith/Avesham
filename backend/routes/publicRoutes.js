import express from "express";
import Pricing from "../models/Pricing.js";

const router = express.Router();

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

export default router;
