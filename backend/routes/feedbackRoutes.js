import express from "express";
import {
    createFeedback,
    getAllFeedback,
    replyToFeedback,
    getUserFeedback,
    deleteFeedback,
    // addMessageToFeedback,
} from "../controllers/feedbackController.js";
import { protectUser, protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// User routes
router.post("/", protectUser, createFeedback);
router.get("/my-feedback", protectUser, getUserFeedback);

// Admin routes
router.get("/", protectAdmin, getAllFeedback);
router.put("/:id/reply", protectAdmin, replyToFeedback);

router.delete("/:id", protectAdmin, deleteFeedback);



// if you want it to be a mini real-time chart use this 
// router.post("/:id/message", protectUser, addMessageToFeedback);
// router.post("/:id/message/admin", protectAdmin, addMessageToFeedback);



export default router;
