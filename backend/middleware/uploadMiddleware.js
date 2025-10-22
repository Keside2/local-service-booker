import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure the uploads folder exists
const uploadDir = "uploads/profile-pics";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Storage Config
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, "uploads/profile-pics");
    },
    filename(req, file, cb) {
        cb(null, `profile-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// ✅ File Filter with descriptive error
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        const error = new Error("Only image files (JPG, PNG) are allowed.");
        error.statusCode = 400; // Bad Request
        cb(error, false);
    }
};

// ✅ Multer upload setup
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

export default upload;
