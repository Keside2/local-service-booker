import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";

/** Helper: remove password before sending admin object */
const formatAdminResponse = (admin) => {
    if (!admin) return null;
    const { password, ...adminData } = admin.toObject();
    return adminData;
};

/** Get Admin Settings Info */
export const getAdminSettingsInfo = async (req, res) => {
    try {
        console.log("req.user in controller:", req.user);

        if (!req.user) {
            return res.status(401).json({ success: false, message: "No user in request" });
        }

        const admin = await Admin.findById(req.user._id).select("-password");
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        res.json({ success: true, admin });
    } catch (error) {
        console.error("Error fetching settings info:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


/** Update Profile */
export const updateAdminProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const admin = await Admin.findById(req.user._id);
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        if (name) admin.name = name;
        if (email) admin.email = email;

        await admin.save();

        res.json({
            success: true,
            message: "Profile updated successfully",
            admin: formatAdminResponse(admin),
        });
    } catch (error) {
        console.error("Update admin profile error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/** Update Business Info */
export const updateBusinessInfo = async (req, res) => {
    try {
        const { businessName, contactEmail, phone } = req.body;
        const admin = await Admin.findById(req.user._id);
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        admin.businessName = businessName || admin.businessName;
        admin.contactEmail = contactEmail || admin.contactEmail;
        admin.businessPhone = phone || admin.businessPhone;

        await admin.save();

        res.json({
            success: true,
            message: "Business info updated successfully",
            admin: formatAdminResponse(admin),
        });
    } catch (error) {
        console.error("Error updating business info:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/** Change Password */
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const admin = await Admin.findById(req.user._id);
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return res
                .status(400)
                .json({ success: false, message: "Current password is incorrect" });
        }

        admin.password = newPassword;
        await admin.save();

        res.json({
            success: true,
            message: "Password updated successfully",
            admin: formatAdminResponse(admin),
        });
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};




/** Update Preferences */
export const updatePreferences = async (req, res) => {
    try {
        const { currency, timezone, notifications } = req.body;
        const admin = await Admin.findById(req.user._id);
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        admin.currency = currency || admin.currency;
        admin.timezone = timezone || admin.timezone;
        admin.notifications = notifications || admin.notifications;

        await admin.save();

        res.json({
            success: true,
            message: "Preferences updated successfully",
            admin: formatAdminResponse(admin),
        });
    } catch (error) {
        console.error("Error updating preferences:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/** ✅ Update Booking Settings */

export const updateBookingSettings = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user._id);
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        const { slotDuration, workingHours } = req.body;
        admin.bookingSettings = {
            slotDuration: slotDuration || admin.bookingSettings?.slotDuration || 30,
            workingHours: workingHours || admin.bookingSettings?.workingHours || "9AM - 5PM",
        };

        await admin.save();

        res.json({
            success: true,
            message: "Booking settings updated",
            admin: formatAdminResponse(admin), // ✅ send updated admin
        });
    } catch (error) {
        console.error("Error updating booking settings:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/** ✅ Update Payment Settings */
export const updatePaymentSettings = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user._id);
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        const { stripeKey, currency } = req.body;
        admin.paymentSettings = {
            stripeKey: stripeKey || admin.paymentSettings?.stripeKey || "",
            currency: currency || admin.paymentSettings?.currency || "USD",
        };

        await admin.save();

        res.json({
            success: true,
            message: "Payment settings updated",
            admin: formatAdminResponse(admin), // ✅ send updated admin
        });
    } catch (error) {
        console.error("Error updating payment settings:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------------- Upload profile picture ----------------

export const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const admin = await Admin.findById(req.user._id);
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        // ✅ Save to "logo" (matches schema!)
        admin.logo = `/uploads/profile-pics/${req.file.filename}`;
        await admin.save();

        res.json({
            success: true,
            message: "Profile picture updated successfully",
            admin: formatAdminResponse(admin), // ✅ return full updated admin
        });
    } catch (error) {
        console.error("Profile picture upload error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


// ✅ Publicly accessible endpoint for currency & basic settings
export const getPublicSettings = async (req, res) => {
    try {
        const admin = await Admin.findOne(); // assuming single admin setup

        if (!admin) {
            return res.status(404).json({ message: "Settings not found" });
        }

        res.json({
            currency: admin.paymentSettings?.currency || "USD",
            businessName: admin.businessName || "My Hotel",
            logo: admin.logo || null,
        });
    } catch (error) {
        console.error("Error fetching public settings:", error);
        res.status(500).json({ message: "Server error" });
    }
};


