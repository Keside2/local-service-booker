import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const NEW_PASSWORD = null; // Only use if you want to reset passwords to a fixed one. Leave null to keep existing.

const fixUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB Atlas");

        const users = await User.find();
        console.log(`Found ${users.length} users.`);

        for (const user of users) {
            let updated = false;

            // Normalize email
            const normalizedEmail = user.email.trim().toLowerCase();
            if (user.email !== normalizedEmail) {
                user.email = normalizedEmail;
                updated = true;
            }

            // Optionally reset password
            if (NEW_PASSWORD) {
                const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
                user.password = hashedPassword;
                updated = true;
            }

            if (updated) {
                await user.save();
                console.log(`✅ Updated user: ${user.name} (${user.email})`);
            } else {
                console.log(`No changes needed for: ${user.name} (${user.email})`);
            }
        }

        console.log("✅ All users processed");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error fixing users:", err);
        process.exit(1);
    }
};

fixUsers();
