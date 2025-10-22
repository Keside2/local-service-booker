import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import Admin from "../models/Admin.js";
import nodemailer from "nodemailer";
import { sendBrandedEmail, buildBrandedEmail } from "../utils/emailService.js";





/* =========================================================
   ✅ USER AUTHENTICATION (Already Implemented)
   ========================================================= */

export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({ name, email, password: hashedPassword, role: "user" });
        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
// const { symbol } = useCurrency();

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/* =========================================================
   ✅ ADMIN DASHBOARD STATS (Already Implemented)
   ========================================================= */
export const getDashboardStats = async (req, res) => {
    try {
        // ✅ Basic totals
        const totalUsers = await User.countDocuments();
        const totalServices = await Service.countDocuments();
        const totalBookings = await Booking.countDocuments();

        // ✅ Total revenue (only completed)
        const totalRevenueResult = await Booking.aggregate([
            { $match: { status: "completed" } },
            { $group: { _id: null, total: { $sum: "$price" } } }
        ]);
        const totalRevenue = totalRevenueResult[0]?.total || 0;

        // ✅ Bookings per month
        const bookingsMonthly = await Booking.aggregate([
            { $group: { _id: { month: { $month: "$date" } }, bookings: { $sum: 1 } } },
            { $sort: { "_id.month": 1 } }
        ]);

        // ✅ Revenue per month (completed only)
        const revenueMonthly = await Booking.aggregate([
            { $match: { status: "completed" } },
            { $group: { _id: { month: { $month: "$date" } }, amount: { $sum: "$price" } } },
            { $sort: { "_id.month": 1 } }
        ]);

        // ✅ Users growth per month
        const usersGrowth = await User.aggregate([
            { $group: { _id: { month: { $month: "$createdAt" } }, users: { $sum: 1 } } },
            { $sort: { "_id.month": 1 } }
        ]);

        // ✅ Revenue breakdown by service
        const revenue = await Booking.aggregate([
            { $match: { status: "completed" } },
            { $group: { _id: "$serviceName", value: { $sum: "$price" } } }
        ]);

        // ✅ Recent bookings (with population)
        const recentBookings = await Booking.find()
            .populate("user service")
            .sort({ date: -1 })
            .limit(5);

        // ✅ Format response
        res.json({
            stats: { totalUsers, totalServices, totalBookings, totalRevenue },
            analytics: {
                bookingsMonthly: bookingsMonthly.map(b => ({
                    month: getMonthName(b._id.month),
                    bookings: b.bookings
                })),
                revenueMonthly: revenueMonthly.map(r => ({
                    month: getMonthName(r._id.month),
                    amount: r.amount
                })),
                usersGrowth: usersGrowth.map(u => ({
                    month: getMonthName(u._id.month),
                    users: u.users
                })),
                revenue: revenue.map(r => ({
                    name: r._id,
                    value: r.value
                }))
            },
            recentBookings
        });
    } catch (err) {
        console.error("❌ Dashboard stats error:", err);
        res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
};

function getMonthName(month) {
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return months[month - 1] || "";
}

/* =========================================================
   ✅ USER MANAGEMENT CRUD
   ========================================================= */
export const getAllUsers = async (req, res) => {
    try {
        // Fetch all users sorted by newest first
        const users = await User.find().sort({ createdAt: -1 });

        // If no users found
        if (!users || users.length === 0) {
            return res.status(200).json({ users: [] });
        }

        res.status(200).json({
            success: true,
            users: users.map((user) => ({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status || "active", // ✅ default if missing
                createdAt: user.createdAt,
            })),
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch user" });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { name, email, role } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, role },
            { new: true }
        ).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ message: "User updated", user });
    } catch (error) {
        res.status(500).json({ message: "Failed to update user" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ message: "User deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete user" });
    }
};

/* =========================================================
   ✅ SERVICE MANAGEMENT CRUD
   ========================================================= */
export const createService = async (req, res) => {
    try {
        const { name, description, price } = req.body;
        const service = new Service({ name, description, price });
        await service.save();
        res.status(201).json({ message: "Service created", service });
    } catch (error) {
        res.status(500).json({ message: "Failed to create service" });
    }
};

export const getAllServices = async (req, res) => {
    try {
        const services = await Service.find();
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch services" });
    }
};

export const updateService = async (req, res) => {
    try {
        const { name, description, price } = req.body;
        const service = await Service.findByIdAndUpdate(
            req.params.id,
            { name, description, price },
            { new: true }
        );
        if (!service) return res.status(404).json({ message: "Service not found" });
        res.json({ message: "Service updated", service });
    } catch (error) {
        res.status(500).json({ message: "Failed to update service" });
    }
};

export const deleteService = async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) return res.status(404).json({ message: "Service not found" });
        res.json({ message: "Service deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete service" });
    }
};

/* =========================================================
   ✅ BOOKING MANAGEMENT CRUD
   ========================================================= */
// ✅ Get all bookings (Exclude cancelled ones)
export const getAllBookings = async (req, res) => {
    try {
        const { page = 1, limit = 5, search = "", status = "", sort = "newest" } = req.query;

        const query = {}; // don't filter out cancelled

        if (status && status !== "all") {
            query.status = status;
        }

        if (search) {
            const users = await User.find({ name: { $regex: search, $options: "i" } }).select("_id");
            const userIds = users.map(u => u._id);
            query.$or = [
                { user: { $in: userIds } },
                { date: { $regex: search, $options: "i" } }
            ];
        }

        const total = await Booking.countDocuments(query);

        const sortOptions = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            "date-asc": { date: 1 },
            "date-desc": { date: -1 }
        };

        const sortOption = sortOptions[sort] || sortOptions["newest"];

        const bookings = await Booking.find(query)
            .populate("user", "name email")
            .populate("service", "name price description")
            .sort(sortOption)
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        res.json({
            bookings,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
            limit: Number(limit)
        });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: "Failed to fetch bookings" });
    }
};

// ✅ Update Booking Status
export const updateBooking = async (req, res) => {
    try {
        const { status, checkIn, checkOut, date } = req.body;
        const allowedStatuses = ["pending", "approved", "completed", "cancelled"];

        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const booking = await Booking.findById(req.params.id)
            .populate("user", "name email")
            .populate("service", "name price");

        if (!booking) return res.status(404).json({ message: "Booking not found" });

        // Apply updates
        if (status) booking.status = status;
        if (checkIn) booking.checkIn = checkIn;
        if (checkOut) booking.checkOut = checkOut;
        if (date) booking.date = date;
        await booking.save();

        // Release service if cancelled
        if (status === "cancelled") {
            const service = await Service.findById(booking.service._id);
            if (service) {
                service.isAvailable = true;
                service.bookedUntil = null;
                await service.save();
            }
        }

        // 📨 Send branded email
        const user = booking.user;
        const service = booking.service;
        if (user?.email && status) {
            const headerColors = {
                approved: "#28a745", // green
                completed: "#007bff", // blue
                cancelled: "#dc3545", // red
                default: "#6c757d",
            };
            const headerColor = headerColors[status] || headerColors.default;

            const checkInDate = booking.checkIn
                ? new Date(booking.checkIn).toDateString()
                : "N/A";
            const checkOutDate = booking.checkOut
                ? new Date(booking.checkOut).toDateString()
                : "N/A";

            let subject = "";
            let content = "";

            switch (status) {
                case "approved":
                    subject = `✅ Booking Approved - ${service.name}`;
                    content = `
            <p>Hi <b>${user.name}</b>,</p>
            <p>Good news! Your booking for <b>${service.name}</b> has been <b>approved</b>.</p>
            <p>Check-in date: <b>${checkInDate}</b></p>
            <p>We look forward to serving you soon!</p>
          `;
                    break;

                case "completed":
                    subject = `🎉 Booking Completed - ${service.name}`;
                    content = `
            <p>Hi <b>${user.name}</b>,</p>
            <p>Your booking for <b>${service.name}</b> has been successfully <b>completed</b>.</p>
            <p>We hope you had a great stay. Thank you for choosing us!</p>
          `;
                    break;

                case "cancelled":
                    subject = `❌ Booking Cancelled - ${service.name}`;
                    content = `
            <p>Hi <b>${user.name}</b>,</p>
            <p>Your booking for <b>${service.name}</b> was <b>cancelled</b>.</p>
            <p>If this was unexpected, please contact our support team.</p>
          `;
                    break;

                default:
                    subject = `ℹ️ Booking Updated - ${service.name}`;
                    content = `
            <p>Hi <b>${user.name}</b>,</p>
            <p>Your booking for <b>${service.name}</b> has been updated to <b>${status}</b>.</p>
          `;
            }

            const html = buildBrandedEmail(subject, content, headerColor);
            await sendBrandedEmail(user.email, subject, html);
        }

        res.json({ message: "Booking updated", booking });
    } catch (err) {
        console.error("Update booking error:", err);
        res.status(500).json({ message: "Server error" });
    }
};





// ✅ User cancels booking
// Cancel a booking by user
export const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) return res.status(404).json({ message: "Booking not found" });

        // Check if the booking belongs to the user
        if (booking.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "You can only cancel your own booking" });
        }

        // Only allow cancelling if not already completed
        if (booking.status === "completed") {
            return res.status(400).json({ message: "Cannot cancel a completed booking" });
        }

        booking.status = "cancelled";
        await booking.save();

        // ✅ Release the service
        const service = await Service.findById(booking.service);
        if (service) {
            service.isAvailable = true;
            service.bookedUntil = null;
            await service.save();
        }

        res.json({ message: "Booking cancelled successfully", booking });
    } catch (error) {
        console.error("Cancel booking error:", error);
        res.status(500).json({ message: "Failed to cancel booking" });
    }
};


// ✅ Bulk Cancel Bookings
export const bulkCancelBookings = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "No booking IDs provided" });
        }

        const result = await Booking.updateMany(
            { _id: { $in: ids }, status: { $ne: "cancelled" } },
            { $set: { status: "cancelled" } }
        );

        res.json({ message: `Cancelled ${result.modifiedCount} booking(s)` });
    } catch (error) {
        console.error("Bulk cancel bookings error:", error);
        res.status(500).json({ message: "Failed to cancel bookings" });
    }
};


/** ================================
 *  ✅ Delete Booking
 * ================================ */
export const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);
        if (!booking) return res.status(404).json({ message: "Booking not found" });
        res.json({ message: "Booking deleted" });
    } catch (error) {
        console.error("Delete booking error:", error);
        res.status(500).json({ message: "Failed to delete booking" });
    }
};

/** ================================
 *  ✅ Bulk Update Booking Status
 * ================================ */
export const bulkUpdateBookingStatus = async (req, res) => {
    try {
        // Accept multiple possible keys from frontend to avoid mismatch
        const bookingIds = req.body.bookingIds || req.body.ids || req.body.selected || [];
        const status = req.body.status;

        if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
            return res.status(400).json({ message: "No booking IDs provided" });
        }

        // Allowed target statuses for bulk operations
        const allowedStatuses = ["pending", "approved", "completed"]; // admin shouldn't bulk-set to cancelled in most cases
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status for bulk update" });
        }

        // Update ONLY bookings that are NOT cancelled
        const result = await Booking.updateMany(
            { _id: { $in: bookingIds }, status: { $ne: "cancelled" } },
            { $set: { status } }
        );

        // result.modifiedCount is the number of docs modified (Mongoose v6+ / Mongo driver v4)
        const updatedCount = result.modifiedCount ?? result.nModified ?? 0;
        const skippedCount = bookingIds.length - updatedCount;

        return res.json({
            message: "Bulk update completed.",
            updatedCount,
            skippedCount
        });
    } catch (error) {
        console.error("Bulk update bookings error:", error);
        res.status(500).json({ message: "Failed to update bookings" });
    }
};


/** ================================
 *  ✅ Bulk Delete Bookings
 * ================================ */
export const bulkDeleteBookings = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids) return res.status(400).json({ message: "IDs required" });

        await Booking.deleteMany({ _id: { $in: ids } });
        res.json({ message: "Bookings deleted successfully" });
    } catch (error) {
        console.error("Bulk delete bookings error:", error);
        res.status(500).json({ message: "Failed to delete bookings" });
    }
};

/* =========================================================
   ✅ Update User Status (Suspend/Activate)
   ========================================================= */
export const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        if (!["active", "suspended"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Prevent self-suspension for admins
        if (user._id.toString() === req.user.id) {
            return res.status(403).json({ message: "You cannot change your own status" });
        }

        user.status = status;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User ${status === "active" ? "activated" : "suspended"} successfully`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
            },
        });
    } catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/* =========================================================
   ✅ Update User Role (Admin/User)
   ========================================================= */
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body; // expected: "admin" or "user"

        if (!["admin", "user"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true }
        ).select("-password");

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ message: `User role updated to ${role}`, user });
    } catch (error) {
        console.error("Role update error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


/* =========================================================
   ✅ Promote User to Admin
   ========================================================= */
export const promoteToAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndUpdate(
            id,
            { role: "admin" },
            { new: true }
        ).select("-password");

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ message: "User promoted to admin", user });
    } catch (error) {
        console.error("Promote error:", error);
        res.status(500).json({ message: "Server error" });
    }
};





export const getAdminProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user._id).select("-password");
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        res.json({ success: true, admin });
    } catch (error) {
        console.error("Get admin profile error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};



export const updateProfilePicture = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id);
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        // Save relative URL instead of full path
        if (req.file) {
            admin.logo = `/uploads/profile-pics/${req.file.filename}`;
        }

        await admin.save();

        res.json({
            success: true,
            message: "Profile picture updated successfully",
            user: admin, // ✅ send updated user (not just logo string)
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Upload failed",
            error: err.message,
        });
    }
};

export const manualBooking = async (req, res) => {
    try {
        const { userId, serviceId, checkIn, checkOut, status } = req.body;

        if (!userId || !serviceId || !checkIn || !checkOut) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // ✅ Prevent double booking
        const overlapping = await Booking.findOne({
            service: serviceId,
            status: { $ne: "cancelled" },
            $or: [{ checkIn: { $lte: checkOut }, checkOut: { $gte: checkIn } }],
        });

        if (overlapping) {
            return res
                .status(400)
                .json({ message: "Service already booked for that date range" });
        }

        // ✅ Get service
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        // ✅ Create booking with service price
        const booking = await Booking.create({
            user: userId,
            service: serviceId,
            checkIn,
            checkOut,
            date: checkIn,
            status,
            price: service.price || 0,
            paymentStatus: "pending",
        });

        // ✅ Update service availability
        service.isAvailable = false;
        service.bookedUntil = checkOut;
        await service.save();

        // ✅ Email user
        const user = await User.findById(userId);
        if (user?.email) {
            // 📧 Mail configuration
            let transporter;

            if (process.env.MAIL_PROVIDER === "mailtrap") {
                transporter = nodemailer.createTransport({
                    host: process.env.MAILTRAP_HOST,
                    port: process.env.MAILTRAP_PORT,
                    auth: {
                        user: process.env.MAILTRAP_USER,
                        pass: process.env.MAILTRAP_PASS,
                    },
                });
            } else {
                transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.GMAIL_USER,
                        pass: process.env.GMAIL_PASS,
                    },
                });
            }

            // ✅ Company branding
            const companyName = "AlphaTech Services";
            const companyLogo =
                "https://upload.wikimedia.org/wikipedia/commons/a/ab/Logo_TV_2015.png"; // Change to your logo URL
            const companyColor = "#1a73e8";

            const mailOptions = {
                from: `${companyName} <${process.env.GMAIL_USER}>`,
                to: user.email,
                subject: `📅 Booking Confirmation - ${service.name}`,
                html: `
        <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 3px 10px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: ${companyColor}; padding: 15px; text-align: center; color: white;">
              <img src="${companyLogo}" alt="${companyName}" style="height: 50px; margin-bottom: 10px;" />
              <h2 style="margin: 0;">${companyName}</h2>
            </div>

            <!-- Body -->
            <div style="padding: 20px;">
              <h3 style="color: ${companyColor};">Booking Confirmation</h3>
              <p>Hi <b>${user.name}</b>,</p>
              <p>Your booking for <b>${service.name}</b> has been created by the admin.</p>

              <table style="width: 100%; margin-top: 15px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><b>Status:</b></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${status}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><b>Check-In:</b></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(
                    checkIn
                ).toDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><b>Check-Out:</b></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(
                    checkOut
                ).toDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><b>Price:</b></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${symbol}${service.price?.toFixed(
                    2
                )}</td>
                </tr>
              </table>

              <p style="margin-top: 20px;">Thank you for choosing <b>${companyName}</b>!</p>
              <p style="font-size: 12px; color: gray;">If you have any questions, feel free to contact our support team.</p>
            </div>

            <!-- Footer -->
            <div style="background: #f1f3f4; padding: 10px; text-align: center; font-size: 12px; color: gray;">
              © ${new Date().getFullYear()} ${companyName}. All rights reserved.
            </div>
          </div>
        </div>`,
            };

            await transporter.sendMail(mailOptions);
        }

        res.json({
            message: "Manual booking created successfully",
            booking,
        });
    } catch (err) {
        console.error("Manual booking error:", err);
        res.status(500).json({ message: "Server error" });
    }
};











