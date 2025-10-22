import dotenv from "dotenv";
dotenv.config();

console.log("DEBUG Stripe Key:", process.env.STRIPE_SECRET_KEY);

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import path from "path";

import feedbackRoutes from "./routes/feedbackRoutes.js";



// Routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import paymentsRoutes from "./routes/paymentsRoutes.js";
import adminSettingsRoutes from "./routes/adminSettingsRouter.js";

import bookingRoutes from "./routes/bookingRoutes.js";

import { autoReenableServices } from "./utils/autoReenableServices.js";
import { autoUnblockServices } from "./utils/autoUnblockServices.js";


// NEW: admin auth (login) routes
// import adminAuthRoutes from "./routes/adminAuthRoutes.js";


// import setupAdminRoutes from "./routes/setupAdmin.js";


const app = express();

// ✅ Allowed origins
const allowedOrigins = [
    "http://localhost:5173", // Vite frontend (local dev)
    "http://localhost:3000", // React default dev port
    "https://yourdomain.com",
    "https://www.yourdomain.com"
];

// app.use("/api/setup", setupAdminRoutes);

// ✅ Global CORS middleware (applies to all routes)
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

// ✅ Handle OPTIONS requests globally
app.options("*", cors());

// ✅ Body parser
app.use(express.json());

// ✅ Logger
app.use(morgan("dev"));

// ✅ Static uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ✅ Payments route (Stripe)
app.use("/api/payments", paymentsRoutes);

app.use("/api/admin/settings", adminSettingsRoutes);
app.use("/api/settings", adminSettingsRoutes);

app.use("/api/feedback", feedbackRoutes);

// Example: test POST endpoint (mock)
app.post("/api/payments/create-payment-intent", (req, res) => {
    // Replace with your Stripe logic
    res.json({ clientSecret: "mock_client_secret" });
});

// ✅ Other routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/user", userRoutes);
app.use("/api/bookings", bookingRoutes);
// app.use("/api/admin/auth", adminAuthRoutes); // admin login

// Run every hour
setInterval(autoUnblockServices, 60 * 60 * 1000);
// ✅ Health Check
app.get("/", (req, res) => {
    res.status(200).json({ message: "API is running..." });
});

// ✅ Error handlers
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ message: "Internal server error" });
});

// Multer error handling (if used)
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
    }

    if (err.statusCode) {
        return res.status(err.statusCode).json({ message: err.message });
    }

    console.error("Unhandled error:", err);
    res.status(500).json({ message: "Something went wrong on the server" });
});

// ✅ MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error.message);
        process.exit(1);
    }
};

connectDB();

// ✅ Start Server
const PORT = process.env.PORT || 5000;
// Run every 5 minutes (300 000 ms)
setInterval(() => {
    autoReenableServices();
}, 300000); // 5 minutes
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
