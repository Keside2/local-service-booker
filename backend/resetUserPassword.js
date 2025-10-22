import bcrypt from "bcryptjs";
import User from "./models/User.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function resetPasswords() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const users = await User.find({ role: "user" });
    const newPassword = "user1234567890";

    for (const user of users) {
      const hashed = await bcrypt.hash(newPassword, 10);
      await User.updateOne({ _id: user._id }, { $set: { password: hashed } });
      console.log(`✅ Reset password for ${user.email}`);
    }

    console.log("🎉 All user passwords reset successfully!");
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

resetPasswords();
