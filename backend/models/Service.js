import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Service name is required"],
            trim: true
        },
        price: {
            type: Number,
            required: [true, "Service price is required"]
        },
        description: {
            type: String,
            default: "No description provided"
        },
        isAvailable: {
            type: Boolean,
            default: true, // true = available for booking
        },
        bookedUntil: {
            type: Date, // optional: when the booking ends
            default: null,
        },
    },
    {
        // timestamps: { createdAt: true, updatedAt: false }, 
        timestamps: true,
        versionKey: false
    }
);

// ✅ Prevent OverwriteModelError
const Service = mongoose.models.Service || mongoose.model("Service", serviceSchema);
export default Service;
