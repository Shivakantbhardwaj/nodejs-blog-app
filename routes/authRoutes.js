const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const User = require("../models/User");

const router = express.Router();



// Multer setup for profile image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });
// User Signup
router.post("/signup", upload.single("profileImage"), async (req, res) => {
    try {
        const { email, password } = req.body;
        const profileImage = req.file ? req.file.filename : null;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        // Ensure password is provided
        if (!password) return res.status(400).json({ message: "Password is required" });

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ email, password: hashedPassword, profileImage });
        await newUser.save();

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Login attempt for email:", email);

        const user = await User.findOne({ email });
        if (!user) {
            console.log("User not found:", email);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Password match result:", isMatch);

        if (!isMatch) {
            console.log("Password mismatch for user:", email);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        console.log("Login successful. Sending token...");
        return res.json({ message: "Login successful", token, user });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ error: "Server error" });
    }
});



module.exports = router;
