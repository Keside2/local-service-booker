import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        timeSlot: {
            type: String,
        },
        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true
        },
        // 🏨 Hotel-style fields
        checkIn: {
            type: Date,

        },
        checkOut: {
            type: Date,

        },
        date: {
            type: Date,
            required: [true, "Booking date is required"]
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "completed", "cancelled"],
            default: "pending"
        },
        price: {
            type: Number,
            required: true,
            min: [0, "Price must be positive"]
        },
        createdAt: {
            type: Date,
            default: Date.now
        },



        // Stripe-related fields
        paymentIntentId: {
            type: String,
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "succeeded", "failed"],
            default: "pending",
        },
        paidAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

// Prevent OverwriteModelError
const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
export default Booking;
