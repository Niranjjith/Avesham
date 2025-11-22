import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

const ADMIN_USER = "avesham";
const ADMIN_PASS = "avesham1234";

// LOGIN
router.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "2h" });
        return res.json({ status: "success", token });
    }

    return res.status(401).json({ status: "failed", message: "Invalid credentials" });
});

export default router;
