import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
    getUserDashboard,
    getUserBookings,
    createBooking,
    cancelBooking,
    getAllServices,
    getUserProfile,
    updateUserProfile,
    changePassword,
    getUserActivity,
    uploadProfilePicture,
    getRecentActivity,

} from "../controllers/userController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ✅ Dashboard (Stats + Recent Bookings)
router.get("/dashboard", authMiddleware, getUserDashboard);

// ✅ Services
router.get("/services", authMiddleware, getAllServices);

// ✅ Bookings
router.get("/bookings", authMiddleware, getUserBookings);
router.post("/bookings", authMiddleware, createBooking);
router.delete("/bookings/:id", authMiddleware, cancelBooking);

// ✅ Profile
router.put("/change-password", authMiddleware, changePassword);
router.get("/profile", authMiddleware, getUserProfile);
router.put("/profile", authMiddleware, updateUserProfile);


router.get("/activity", authMiddleware, getUserActivity);
router.get("/recent-activity", authMiddleware, getRecentActivity);
router.put("/profile-picture", authMiddleware, upload.single("profilePic"), uploadProfilePicture);





export default router;
