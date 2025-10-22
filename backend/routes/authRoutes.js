import express from "express";
import { forgotPassword } from "../controllers/authController.js";
import { registerUser, login } from "../controllers/authController.js";

// import {
//     registerAdmin,
//     loginAdmin,
//     getAdminProfile,
//     updateAdminProfile,
// } from "../controllers/authController.js";
// import { protectAdmin } from "../middleware/authMiddleware.js";


const router = express.Router();


// ✅ Register Route
router.post("/register", registerUser);

// ✅ Login Route
router.post("/login", login);

// forgot password
router.post("/forgot-password", forgotPassword);


// ✅ Auth routes
// router.post("/register", registerAdmin);
// router.post("/login", loginAdmin);
// router.get("/profile", protectAdmin, getAdminProfile);
// router.put("/profile", protectAdmin, updateAdminProfile);




export default router;
