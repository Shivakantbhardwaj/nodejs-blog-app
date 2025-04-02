require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");

const app = express();
connectDB();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Log to ensure that routes are being hit
console.log("Server is running...");

// Import routes
const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");

// Log to ensure routes are being registered
console.log("Setting up routes...");

// Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);  // Should work

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
