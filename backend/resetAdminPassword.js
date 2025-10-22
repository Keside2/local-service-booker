// backend/resetAdminPassword.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Admin from "./models/Admin.js"; // adjust path if needed

dotenv.config();

const EMAIL = "admin@example.com";
const NEW_PASSWORD = "admin123456"; // raw password

const run = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("❌ MONGO_URI is missing. Add it to your backend .env");
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        const admin = await Admin.findOne({ email: EMAIL });
        if (!admin) {
            console.log(`⚠️ No admin found with email ${EMAIL}`);
            await mongoose.disconnect();
            return;
        }

        // ⚠️ Important: assign raw password, let schema pre-save hook hash it
        admin.password = NEW_PASSWORD;
        await admin.save();

        // Verify the new password works
        const isMatch = await bcrypt.compare(NEW_PASSWORD, admin.password);
        console.log(`✅ Reset password for ${EMAIL} to "${NEW_PASSWORD}"`);
        console.log("🔍 Password hash matches new password?", isMatch);

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("❌ Error resetting password:", err.message || err);
        await mongoose.disconnect();
        process.exit(1);
    }
};

run();
