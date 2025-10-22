import express from "express";
import { protectAdmin } from "../middleware/authMiddleware.js";
import {
  getAdminSettingsInfo,
  updateAdminProfile,
  updateBusinessInfo,
  changePassword,
  updatePreferences,
  updateBookingSettings,
  updatePaymentSettings,
  uploadProfilePicture,
  getPublicSettings,
} from "../controllers/adminSettingsController.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Load settings info
router.get("/info", protectAdmin, getAdminSettingsInfo);

// Update profile
router.put("/profile", protectAdmin, updateAdminProfile);

// Update business info
router.put("/business", protectAdmin, updateBusinessInfo);

// Update password
router.put("/password", protectAdmin, changePassword);

// Update preferences
router.put("/preferences", protectAdmin, updatePreferences);

router.get("/public", getPublicSettings);


router.put("/booking", protectAdmin, updateBookingSettings);
router.put("/payments", protectAdmin, updatePaymentSettings);

// Upload profile picture (consistent field: "logo")
router.put("/profile-picture", protectAdmin, upload.single("profilePic"), uploadProfilePicture);


export default router;
