// seedAdmin.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Admin from "./models/Admin.js"; // ✅ Use Admin model

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const adminEmail = "admin@example.com";
        const existingAdmin = await Admin.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log("✅ Admin already exists:", existingAdmin.email);
        } else {
            const hashedPassword = await bcrypt.hash("keside123", 10);
            const admin = new Admin({
                name: "Super Admin",
                email: adminEmail,
                password: hashedPassword, // hashed manually
                role: "admin",
            });
            await admin.save();
            console.log("✅ Admin created:", adminEmail);
        }

        mongoose.connection.close();
    } catch (error) {
        console.error("❌ Error seeding admin:", error);
        mongoose.connection.close();
    }
};

seedAdmin();
