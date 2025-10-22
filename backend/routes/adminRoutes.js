import express from "express";
import {
    getDashboardStats,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    updateUserStatus,
    updateUserRole,
    promoteToAdmin,
    createService,
    getAllServices,
    updateService,
    deleteService,
    getAllBookings,
    updateBooking,
    deleteBooking,
    bulkDeleteBookings,
    bulkUpdateBookingStatus,
    cancelBooking
} from "../controllers/adminController.js";



// import { getAdminProfile } from "../controllers/authController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";


import { getAdminSettingsInfo, updateAdminProfile, updateBusinessInfo, changePassword, updatePreferences } from "../controllers/adminSettingsController.js";

import { manualBooking } from "../controllers/adminController.js";


const router = express.Router();

/** ------------------------------
 * ✅ Admin Authentication & Profile
 * ------------------------------ */
// router.get("/auth/profile", protectAdmin, getAdminProfile); // ✅ Get Admin Profile
// router.put("/profile", protectAdmin, updateProfile); // ✅ Update Basic Profile Info

/** ------------------------------
 * ✅ Admin Settings
 * ------------------------------ */
// ✅ Get Settings Info
router.get("/settings/info", protectAdmin, getAdminSettingsInfo);

// ✅ Update Profile
router.put("/settings/profile", protectAdmin, updateAdminProfile);

// ✅ Update Business Info
router.put("/settings/business", protectAdmin, updateBusinessInfo);

// ✅ Change Password
router.put("/settings/password", protectAdmin, changePassword);

// ✅ Update Preferences
router.put("/settings/preferences", protectAdmin, updatePreferences);


/** ------------------------------
 * ✅ Dashboard Stats
 * ------------------------------ */
router.get("/dashboard", protectAdmin, getDashboardStats);

/** ------------------------------
 * ✅ User Management
 * ------------------------------ */
router.get("/users", protectAdmin, getAllUsers);
router.get("/users/:id", protectAdmin, getUserById);
router.put("/users/:id", protectAdmin, updateUser);
router.delete("/users/:id", protectAdmin, deleteUser);
router.put("/users/:id/status", protectAdmin, updateUserStatus);  // Suspend / Activate
router.put("/users/:id/role", protectAdmin, updateUserRole);      // Update role
router.put("/users/:id/promote", protectAdmin, promoteToAdmin);   // Promote to admin

/** ------------------------------
 * ✅ Service Management
 * ------------------------------ */
router.post("/services", protectAdmin, createService);
router.get("/services", protectAdmin, getAllServices);
router.put("/services/:id", protectAdmin, updateService);
router.delete("/services/:id", protectAdmin, deleteService);

/** ------------------------------
 * ✅ Booking Management
 * ------------------------------ */
router.get("/bookings", protectAdmin, getAllBookings);
router.put("/bookings/:id", protectAdmin, updateBooking);
router.delete("/bookings/:id", protectAdmin, deleteBooking);
router.post("/bookings/bulk-delete", protectAdmin, bulkDeleteBookings);
router.post("/bookings/bulk-status", protectAdmin, bulkUpdateBookingStatus);

// ✅ User route to cancel their booking
router.patch("/bookings/:id/cancel", protectAdmin, cancelBooking);

router.post("/manual-booking", protectAdmin, manualBooking);


export default router;
