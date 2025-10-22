import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

// ✅ Generate JWT
export const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// ✅ Register User
export const registerUser = async (req, res) => {
    try {
        let { name, email, password } = req.body;

        // Normalize
        email = email.trim().toLowerCase();
        password = password.trim();
        name = name.trim();

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Create user (pre-save hook will hash password)
        const user = await User.create({
            name,
            email,
            password, // raw password; will be hashed in schema pre-save
            role: "user", // default to user; admin registration through backend only
        });

        res.json({
            message: "User registered successfully",
            token: generateToken(user._id),
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// ✅ Login User
// export const loginUser = async (req, res) => {
//     try {
//         let { email, password } = req.body;
//         email = email.trim().toLowerCase();
//         password = password.trim();

//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(400).json({ message: "Invalid credentials" });
//         }

//         // ✅ Check if user is suspended
//         if (user.status === "suspended") {
//             return res.status(403).json({ message: "Your account is suspended. Contact support." });
//         }

//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(400).json({ message: "Invalid credentials" });
//         }

//         res.json({
//             message: "Login successful",
//             token: generateToken(user._id, user.role),
//             user: {
//                 id: user._id,
//                 name: user.name,
//                 email: user.email,
//                 role: user.role,
//                 status: user.status, // ✅ Include status for UI
//             },
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: "Server error" });
//     }
// };


// ✅ Forgot Password
export const forgotPassword = async (req, res) => {
    try {
        let { email, newPassword } = req.body;
        email = email.trim().toLowerCase();
        newPassword = newPassword.trim();

        if (!email || !newPassword) {
            return res.status(400).json({ message: "Email and new password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Option 1: Use schema pre-save hook to hash
        user.password = newPassword;
        await user.save();

        // Option 2: If you prefer manual hash, comment Option 1 and use:
        // const hashedPassword = await bcrypt.hash(newPassword, 10);
        // user.password = hashedPassword;
        // await user.save();

        res.json({ message: "Password reset successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};


// ✅ Admin Register
export const registerAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const adminExists = await Admin.findOne({ email });
        if (adminExists) {
            return res.status(400).json({ success: false, message: "Admin already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const admin = await Admin.create({
            name,
            email,
            password: hashedPassword,
        });

        res.json({
            success: true,
            message: "Admin registered successfully",
            token: generateToken(admin._id),
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ✅ Admin Login
// export const loginAdmin = async (req, res) => {
//     try {
//         const { email, password } = req.body;
//         console.log("📩 Incoming login request:", { email, password });

//         const admin = await Admin.findOne({ email });
//         if (!admin) {
//             console.log("❌ No admin found for:", email);
//             return res.status(400).json({ success: false, message: "Invalid credentials" });
//         }

//         console.log("✅ Found admin:", admin.email, "Stored hash:", admin.password);

//         const isMatch = await bcrypt.compare(password, admin.password);
//         console.log("🔑 Password match result:", isMatch);

//         if (!isMatch) {
//             return res.status(400).json({ success: false, message: "Invalid credentials" });
//         }

//         // ✅ generate a real JWT with role
//         const token = generateToken(admin._id, "admin");


//         res.json({
//             success: true,
//             message: "Admin login successful",
//             token,
//             admin: { id: admin._id, email: admin.email, role: admin.role }
//         });

//     } catch (err) {
//         console.error("💥 Error in loginAdmin:", err);
//         res.status(500).json({ success: false, message: "Server error" });
//     }
// };





// ✅ Unified Login (handles both admin + user)
export const login = async (req, res) => {
    try {
        let { email, password } = req.body;
        email = email.trim().toLowerCase();

        // First check Admin collection
        let account = await Admin.findOne({ email });
        let role = "admin"; // default if found in Admins

        // If not found, check User collection
        if (!account) {
            account = await User.findOne({ email });
            if (!account) {
                return res.status(400).json({ success: false, message: "Invalid credentials" });
            }
            role = account.role || "user";
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, account.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        // Generate token with correct role
        const token = generateToken(account._id, role);

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: account._id,
                name: account.name,
                email: account.email,
                role,
                logo: account.logo || "", // ✅ include logo for admin sidebar
                businessName: account.businessName || "",
                businessPhone: account.businessPhone || "",
                contactEmail: account.contactEmail || "",
                currency: account.currency || "USD",
                timezone: account.timezone || "UTC",
            },
        });

    } catch (err) {
        console.error("💥 Login error:", err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};



// ✅ Get Admin Profile
export const getAdminProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Not authorized" });
        }

        res.json({ success: true, admin: req.user }); // already selected without password
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load profile", error: error.message });
    }
};





// ✅ Update Admin Profile (with currentPassword check)
export const updateAdminProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id);
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }

        // Update general info
        admin.name = req.body.name || admin.name;
        admin.email = req.body.email || admin.email;

        // ✅ Password change flow
        if (req.body.currentPassword && req.body.newPassword) {
            const isMatch = await admin.matchPassword(req.body.currentPassword);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "Current password is incorrect" });
            }

            admin.password = req.body.newPassword; // will be hashed by pre("save")
        }

        await admin.save();
        res.json({ success: true, message: "Profile updated successfully", admin });
    } catch (error) {
        res.status(500).json({ success: false, message: "Profile update failed", error: error.message });

    }
};

