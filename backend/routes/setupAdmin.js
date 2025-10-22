// import express from "express";
// import bcrypt from "bcryptjs";
// import Admin from "../models/Admin.js";

// const router = express.Router();

// // ⚠️ One-time route to create initial admin
// router.post("/create-initial-admin", async (req, res) => {
//     try {
//         const { name, email, password } = req.body;

//         // check if admin already exists
//         const existing = await Admin.findOne({ email });
//         if (existing) {
//             return res.status(400).json({ message: "Admin already exists" });
//         }

//         // hash password
//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         // create admin
//         const admin = await Admin.create({
//             name,
//             email,
//             password: hashedPassword,
//             role: "admin",
//         });

//         res.json({
//             success: true,
//             message: "Initial admin created",
//             admin: { id: admin._id, name: admin.name, email: admin.email },
//         });
//     } catch (error) {
//         console.error("Error creating initial admin:", error);
//         res.status(500).json({ message: "Server error" });
//     }
// });

// export default router;
