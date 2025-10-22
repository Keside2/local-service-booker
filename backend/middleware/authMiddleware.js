import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Admin from "../models/Admin.js"; // ✅ Import Admin model
// ✅ Verify JWT Token (for all logged-in users)
export const verifyToken = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }
        const token = header.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.tokenPayload = decoded;

        // Attach req.user — try User first, then Admin
        req.user =
            (await User.findById(decoded.id).select("-password")) ||
            (await Admin.findById(decoded.id).select("-password")) ||
            null;

        if (!req.user) {
            // token refers to non-existing account
            return res.status(401).json({ message: "Not authorized, user not found" });
        }

        next();
    } catch (err) {
        console.error("verifyToken error:", err);
        return res.status(401).json({ message: "Not authorized, token failed" });
    }
};

export const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("_id name email");
        if (!req.user) return res.status(401).json({ message: "User not found" });
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
};

export const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
};

// ✅ Check if user is Admin
export const isAdmin = (req, res, next) => {

    if (roleFromToken === "admin" || roleFromUser === "admin") {
        return next();
    }

    return res.status(403).json({ message: "Not authorized as admin" });
};


export const protectAdmin = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Try to find in Admin collection first
            let admin = await Admin.findById(decoded.id).select("-password");

            if (!admin) {
                // If not found in Admins, check Users with role=admin
                const userAdmin = await User.findById(decoded.id).select("-password");
                if (userAdmin && userAdmin.role === "admin") {
                    req.user = userAdmin;
                    return next();
                }
            } else {
                req.user = admin;
                return next();
            }

            return res.status(401).json({ success: false, message: "Not authorized as admin" });

        } catch (error) {
            console.error("Auth error:", error.message);
            return res.status(401).json({ success: false, message: "Token invalid or expired" });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }
};


export const protectUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Missing token" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ✅ Find the user to confirm they exist and are active
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        if (user.status === "suspended" || user.isActive === false) {
            return res.status(403).json({ reason: "suspended" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("❌ protectUser error:", error.message);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};


export default function auth(roles = []) {
    return async (req, res, next) => {
        // run verifyToken first
        await verifyToken(req, res, function afterVerify() {
            // if roles specified, enforce them
            if (roles.length > 0 && !roles.includes(req.user?.role)) {
                return res.status(403).json({ message: "Access denied" });
            }
            next();
        });
    };
}
