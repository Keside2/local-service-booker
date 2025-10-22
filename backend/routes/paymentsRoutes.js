import express from "express";
import { createPaymentIntent, confirmBooking, stripeWebhookHandler } from "../controllers/paymentsController.js";
import { verifyToken } from "../middleware/authMiddleware.js"; // adapt to your middleware names


const router = express.Router();

// Preflight support for this router (optional but helps sometimes)
router.options("*", (req, res) => res.sendStatus(200));

// Protected route to create PaymentIntent (user must be authenticated)
router.post("/create-payment-intent", verifyToken, createPaymentIntent);

// Confirm booking AFTER successful payment
router.post("/confirm-booking", verifyToken, confirmBooking);

// Webhook - DO NOT use verifyToken here; Stripe posts directly
// Use express.raw middleware specifically for this route
router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    stripeWebhookHandler
);

export default router;
