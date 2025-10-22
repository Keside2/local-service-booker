import express from "express";
import Booking from "../models/Booking.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Create new booking (authenticated users)
router.post("/", auth(), async (req, res) => {
    try {
        const { service, date, price } = req.body;

        if (!service || !date || !price) {
            return res.status(400).json({ message: "Missing booking details" });
        }

        const booking = await Booking.create({
            service,
            user: req.user._id, // Associate booking with logged-in user
            date,
            price,
            status: "pending",
        });

        res.status(201).json({ message: "Booking successful", booking });
    } catch (err) {
        console.error("Error creating booking:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Get bookings for the logged-in user
router.get("/user", auth(), async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate("service")
            .populate("user", "name email");
        res.json(bookings);
    } catch (err) {
        console.error("Error fetching user bookings:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Get all bookings (admin only)
router.get("/", auth(["admin"]), async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("service")
            .populate("user", "name email role");
        res.json(bookings);
    } catch (err) {
        console.error("Error fetching all bookings:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Update booking (admin only)
router.put("/:id", auth(["admin"]), async (req, res) => {
    try {
        const { date, price, status } = req.body;

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { date, price, status },
            { new: true }
        );

        if (!booking) return res.status(404).json({ message: "Booking not found" });
        res.json(booking);
    } catch (err) {
        console.error("Error updating booking:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Delete booking (admin only)
router.delete("/:id", auth(["admin"]), async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);
        if (!booking) return res.status(404).json({ message: "Booking not found" });
        res.json({ message: "Booking deleted successfully" });
    } catch (err) {
        console.error("Error deleting booking:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Public route - get active bookings (used for availability display)
router.get("/active", async (req, res) => {
    try {
        const bookings = await Booking.find({
            status: { $in: ["pending", "approved", "completed"] }
        }).populate("service", "name");

        res.json(bookings);
    } catch (err) {
        console.error("Error fetching active bookings:", err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
