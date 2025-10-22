import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,

        },
        role: {
            type: String,
            default: "admin", // ✅ For role-based checks
        },

        // ✅ Business Info
        businessName: {
            type: String,
            default: "",
        },
        businessPhone: {
            type: String,
            default: "",
        },
        contactEmail: {
            type: String,
            default: "",
        },
        logo: {
            type: String,
            default: "", // ✅ Will store image path like `/uploads/logo.png`
        },

        // ✅ Preferences
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            push: { type: Boolean, default: false },
        },
        currency: {
            type: String,
            default: "USD",
        },
        timezone: {
            type: String,
            default: "UTC",
        },
        bookingSettings: {
            slotDuration: { type: Number, default: 30 }, // minutes
            workingHours: { type: String, default: "9AM - 5PM" },
        },

        paymentSettings: {
            stripeKey: { type: String, default: "" },
            currency: { type: String, default: "USD" },
        },

    },
    { timestamps: true }
);

// ✅ Hash password before saving
adminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// ✅ Compare password for login
adminSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
