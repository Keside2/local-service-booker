import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import Activity from "../models/Activity.js";




// Dashboard: stats + recent bookings
export const getUserDashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        const totalBookings = await Booking.countDocuments({ user: userId });
        const pendingBookings = await Booking.countDocuments({ user: userId, status: "pending" });
        const completedBookings = await Booking.countDocuments({ user: userId, status: "completed" });
        const cancelledBookings = await Booking.countDocuments({ user: userId, status: "cancelled" });

        const recentBookings = await Booking.find({ user: userId })
            .populate("service")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // Map bookings to frontend-friendly format
        const mappedBookings = recentBookings.map(b => ({
            _id: b._id,
            serviceName: b.service?.name || "Unknown",
            date: b.date,
            status: b.status.charAt(0).toUpperCase() + b.status.slice(1)
        }));

        res.json({
            totalBookings,
            pendingBookings,
            completedBookings,
            cancelledBookings,
            recentBookings: mappedBookings
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Fetch all services (with availability status)
export const getAllServices = async (req, res) => {
    try {
        const services = await Service.find().lean();

        // Optionally auto-refresh availability if bookedUntil expired
        const now = new Date();
        for (const s of services) {
            if (s.bookedUntil && new Date(s.bookedUntil) < now) {
                s.isAvailable = true;
                s.bookedUntil = null;
                await Service.updateOne({ _id: s._id }, { isAvailable: true, bookedUntil: null });
            }
        }

        res.json(services);
    } catch (error) {
        console.error("Error fetching services:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// controllers/serviceController.js
export const getServices = async (req, res) => {
    try {
        const now = new Date();
        const services = await Service.find().lean();

        const enriched = await Promise.all(services.map(async (s) => {
            // Find most recent active booking for this service (pending/approved/completed)
            // We consider bookings that haven't ended yet (checkOut >= now) OR single-date (date) bookings for today
            const activeBooking = await Booking.findOne({
                service: s._id,
                status: { $in: ["pending", "approved", "completed"] },
                $or: [
                    // bookings with checkOut present and not ended
                    { checkOut: { $gte: now } },
                    // bookings with a single date field that equals today or in the future
                    { date: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } }
                ]
            }).sort({ createdAt: -1 }).lean();

            // Determine isAvailable and currentBookingStatus
            let currentBookingStatus = activeBooking ? activeBooking.status : null;
            let isAvailable = !activeBooking;

            // If service has a bookedUntil on the service document, and it is in the past, free it
            if (s.bookedUntil && new Date(s.bookedUntil) < now) {
                isAvailable = true;
                currentBookingStatus = null;

                // optionally update db to reflect free state (non-blocking)
                await Service.updateOne({ _id: s._id }, { $set: { isAvailable: true, bookedUntil: null } });
            }

            // If there's an active booking and the booking has checkOut or computed bookedUntil, use that for frontend
            const bookedUntil = s.bookedUntil || (activeBooking && (activeBooking.checkOut || activeBooking.date)) || null;

            return {
                ...s,
                currentBookingStatus,
                isAvailable,
                bookedUntil,
            };
        }));

        res.json(enriched);
    } catch (err) {
        console.error("Error in getServices:", err);
        res.status(500).json({ message: "Server error" });
    }
};





// ✅ Get all bookings for a user with full info (checkIn, checkOut, duration)
export const getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate("service", "name price description")
            .sort({ createdAt: -1 });

        if (!bookings.length) {
            return res.json([]);
        }

        // Format and add check-in/out + duration
        const formattedBookings = bookings.map((b) => {
            let duration = null;
            if (b.checkIn && b.checkOut) {
                const diffTime = new Date(b.checkOut) - new Date(b.checkIn);
                duration = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            }

            return {
                _id: b._id,
                service: {
                    _id: b.service?._id,
                    name: b.service?.name || "Unknown Service",
                    price: b.service?.price || 0,
                    description: b.service?.description || "",
                },
                date: b.date || null,
                checkIn: b.checkIn || null,
                checkOut: b.checkOut || null,
                duration,
                status: b.status,
                price: b.price || b.service?.price || 0,
                paymentStatus: b.paymentStatus || "pending",
            };
        });

        res.json(formattedBookings);
    } catch (error) {
        console.error("❌ Error fetching bookings:", error);
        res.status(500).json({ message: "Server error" });
    }
};





// ---------------- Create Booking ----------------
// ✅ Create booking with date range

export const createBooking = async (req, res) => {
    try {
        const { serviceId, date, timeSlot, checkIn, checkOut } = req.body;

        if (!serviceId)
            return res.status(400).json({ message: "Service ID required" });

        const service = await Service.findById(serviceId);
        if (!service)
            return res.status(404).json({ message: "Service not found" });

        // Determine checkIn/checkOut
        let inDate = null;
        let outDate = null;

        if (checkIn && checkOut) {
            inDate = new Date(checkIn);
            outDate = new Date(checkOut);
            if (inDate >= outDate)
                return res
                    .status(400)
                    .json({ message: "checkOut must be after checkIn" });
        } else if (date && timeSlot) {
            inDate = new Date(date);
            if (timeSlot === "24hrs") {
                outDate = new Date(inDate.getTime() + 24 * 60 * 60 * 1000);
            } else {
                outDate = new Date(inDate);
                outDate.setHours(23, 59, 59, 999);
            }
        } else {
            return res
                .status(400)
                .json({ message: "Either checkIn/checkOut or date+timeSlot required" });
        }

        // Check overlapping bookings
        const overlapQuery = {
            service: serviceId,
            status: { $in: ["pending", "approved", "completed"] },
            $or: [
                { checkIn: { $lte: outDate }, checkOut: { $gte: inDate } },
                {
                    date: {
                        $gte: new Date(inDate).setHours(0, 0, 0, 0),
                        $lte: new Date(outDate).setHours(23, 59, 59, 999),
                    },
                },
            ],
        };

        const overlapping = await Booking.findOne(overlapQuery);
        if (overlapping) {
            return res
                .status(400)
                .json({ message: "This service is already booked for those dates" });
        }

        // ✅ Calculate days and total price
        const days = Math.max(
            1,
            Math.ceil((new Date(outDate) - new Date(inDate)) / (1000 * 60 * 60 * 24))
        );
        const totalPrice = service.price * days;

        // ✅ Create booking
        const booking = await Booking.create({
            user: req.user.id,
            service: serviceId,
            checkIn: inDate,
            checkOut: outDate,
            price: totalPrice,
            status: "pending",
            paymentStatus: "pending",
        });

        // Update service availability
        service.isAvailable = false;
        service.bookedUntil = outDate;
        await service.save();

        // ✅ Send confirmation email
        const user = await User.findById(req.user.id);
        if (user?.email) {
            const html = bookingEmailTemplate(
                user,
                service,
                "Pending Confirmation",
                inDate,
                outDate,
                service.price,
                days
            );
            await sendEmail(user.email, "Booking Confirmation", html);
        }

        res
            .status(201)
            .json({ success: true, message: "Booking created", booking });
    } catch (err) {
        console.error("Booking error:", err);
        res.status(500).json({ message: "Server error" });
    }
};




// ---------------- Cancel Booking ----------------
export const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id).populate("service");

        if (!booking) return res.status(404).json({ message: "Booking not found" });
        if (booking.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to cancel" });
        }

        if (["completed", "cancelled"].includes(booking.status)) {
            return res.status(400).json({ message: "Cannot cancel this booking" });
        }

        booking.status = "cancelled";
        await booking.save();

        // ✅ Make service available again
        if (booking.service) {
            booking.service.isAvailable = true;
            booking.service.bookedUntil = null;
            await booking.service.save();
        }

        res.json({ success: true, message: "Booking cancelled successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};


// Profile
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password").lean();
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: "Name and email are required" });
        }

        // Ensure email is unique (excluding current user)
        const exists = await User.findOne({ email, _id: { $ne: req.user.id } });
        if (exists) {
            return res.status(400).json({ message: "Email already in use" });
        }

        const updated = await User.findByIdAndUpdate(
            req.user.id,
            { name, email },
            { new: true, runValidators: true }
        ).select("-password");

        res.json({ message: "Profile updated", user: updated });
    } catch (error) {
        console.error("updateUserProfile error:", error);
        res.status(500).json({ message: "Failed to update profile" });
    }
};

// NEW: change password
export const changePassword = async (req, res) => {
    try {
        const userId = req.user.id; // assuming auth middleware adds req.user
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        // ✅ Rely on pre-save hook to hash
        user.password = newPassword;
        await user.save();


        return res.json({ message: "Password updated successfully" });
    } catch (err) {
        console.error("Change password error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};


// ---------------- Get user activity ----------------
export const getUserActivity = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate("service", "name") // Only fetch service name
            .sort({ createdAt: -1 })

            .limit(10);

        const activity = bookings.map(b => ({
            message: `Booked ${b.service?.name || "Unknown Service"} for ${new Date(b.date).toLocaleDateString()}`,
            createdAt: b.createdAt
        }));


        res.json(activity);
    } catch (error) {
        console.error("Error fetching activity:", error);
        res.status(500).json({ message: "Server error" });
    }
};


// ---------------- Upload profile picture ----------------
export const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Save file path in DB
        user.profilePic = `/uploads/profile-pics/${req.file.filename}`;
        await user.save();

        res.json({
            message: "Profile picture updated successfully",
            profilePic: user.profilePic
        });
    } catch (error) {
        console.error("Profile picture upload error:", error);
        res.status(500).json({ message: "Server error" });
    }
};




// ✅ Get Recent Activity
export const getRecentActivity = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("service", "name");

        const activity = bookings.map(b => ({
            id: b._id,
            service: b.service.name,
            status: b.status,
            date: b.date
        }));

        res.json(activity);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};



// ✅ Get user profile
export const getProfile = async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
};

// ✅ Update profile
export const updateProfile = async (req, res) => {
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name || user.name;
    user.email = email || user.email;
    await user.save();

    res.json({ user });
};