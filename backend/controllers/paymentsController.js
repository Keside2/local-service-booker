// controllers/paymentsController.js
import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import Stripe from "stripe";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import { sendBrandedEmail, buildBrandedEmail } from "../utils/emailService.js";

/**
 * Create booking + PaymentIntent
 * POST /api/payments/create-payment-intent
 */
// export const createPaymentIntent = async (req, res) => {
//     try {
//         // Initialize Stripe here so env is guaranteed loaded
//         const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//             apiVersion: "2024-06-20",
//         });

//         console.log("DEBUG Stripe Key:", process.env.STRIPE_SECRET_KEY?.slice(0, 10));

//         const userId = req.user.id;
//         const {
//             serviceId,
//             date,
//             timeSlot,
//             amount,
//             currency = process.env.STRIPE_CURRENCY || "usd",
//             receipt_email,
//         } = req.body;

//         if (!serviceId || !date || !amount) {
//             return res
//                 .status(400)
//                 .json({ message: "serviceId, date and amount are required" });
//         }

//         const service = await Service.findById(serviceId);
//         if (!service) return res.status(404).json({ message: "Service not found" });

//         // 1) Create booking (status pending until payment succeeds)
//         const booking = await Booking.create({
//             user: userId,
//             service: serviceId,
//             date: new Date(date),
//             timeSlot: timeSlot || "",
//             status: "pending",
//             price: Number(amount),
//         });

//         // 2) Create Stripe PaymentIntent
//         const paymentIntent = await stripe.paymentIntents.create({
//             amount: Math.round(Number(amount) * 100), // cents
//             currency,
//             metadata: {
//                 bookingId: String(booking._id),
//                 userId: String(userId),
//                 serviceId: String(serviceId),
//             },
//             receipt_email: receipt_email || undefined,
//         });

//         // 3) Save paymentIntent id
//         booking.paymentIntentId = paymentIntent.id;
//         await booking.save();

//         return res.json({
//             clientSecret: paymentIntent.client_secret,
//             bookingId: booking._id,
//         });
//     } catch (err) {
//         console.error("❌ Create PaymentIntent error:", err);
//         return res
//             .status(500)
//             .json({ message: "Failed to create payment intent", error: err.message });
//     }
// };

// 1️⃣ Create PaymentIntent only
export const createPaymentIntent = async (req, res) => {
    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: "2024-06-20",
        });
        const { amount } = req.body;
        if (!amount) {
            return res.status(400).json({ message: "Amount is required" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(Number(amount) * 100),
            currency: "usd",
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        console.error("❌ Create PaymentIntent error:", err);
        res.status(500).json({ message: err.message });
    }
};


// ✅ Confirm booking after successful payment
export const confirmBooking = async (req, res) => {
    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: "2024-06-20",
        });

        const userId = req.user.id;
        const {
            serviceId,
            date,
            timeSlot,
            amount,
            checkIn,
            checkOut,
            paymentIntentId,
        } = req.body;

        if (!serviceId || !amount) {
            return res.status(400).json({ message: "Missing booking info" });
        }

        const service = await Service.findById(serviceId);
        if (!service) return res.status(404).json({ message: "Service not found" });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // 🕓 Determine booking dates
        let inDate, outDate;
        if (checkIn && checkOut) {
            inDate = new Date(checkIn);
            outDate = new Date(checkOut);
            if (inDate >= outDate)
                return res
                    .status(400)
                    .json({ message: "Check-out must be after check-in" });
        } else if (date) {
            inDate = new Date(date);
            outDate = new Date(date);
            if (timeSlot === "24hrs") outDate.setDate(outDate.getDate() + 1);
            else outDate.setHours(23, 59, 59, 999);
        } else {
            return res.status(400).json({
                message: "Either checkIn/checkOut or date/timeSlot is required",
            });
        }

        // 🔎 Prevent overlapping bookings
        const overlap = await Booking.findOne({
            service: serviceId,
            status: { $in: ["pending", "approved", "completed"] },
            $or: [
                { checkIn: { $lte: outDate }, checkOut: { $gte: inDate } },
                { date: { $gte: inDate, $lte: outDate } },
            ],
        });

        if (overlap) {
            return res
                .status(400)
                .json({ message: "This service is already booked for those dates." });
        }

        // ✅ Create booking
        const booking = new Booking({
            user: userId,
            service: serviceId,
            price: Number(amount),
            status: "pending",
            paymentStatus: "succeeded",
            paymentIntentId: paymentIntentId || null,
            checkIn: inDate,
            checkOut: outDate,
            date: date || inDate,
            timeSlot: timeSlot || "N/A",
        });

        await booking.save();

        // 🔒 Update service availability
        service.isAvailable = false;
        service.bookedUntil = outDate;
        await service.save();

        // 💌 1️⃣ Customer confirmation email (Green)
        const customerSubject = `✅ Booking Confirmed – ${service.name}`;
        const customerHtml = buildBrandedEmail(
            "Booking Confirmed 🎉",
            `
        <p>Hi <b>${user.name}</b>,</p>
        <p>Your booking for <b>${service.name}</b> has been successfully created and paid for.</p>
        <table style="width:100%; margin-top:15px; border-collapse:collapse;">
          <tr>
            <td style="padding:8px; border-bottom:1px solid #eee;"><b>Status:</b></td>
            <td style="padding:8px; border-bottom:1px solid #eee;">${booking.status}</td>
          </tr>
          <tr>
            <td style="padding:8px; border-bottom:1px solid #eee;"><b>Check-In:</b></td>
            <td style="padding:8px; border-bottom:1px solid #eee;">${inDate.toDateString()}</td>
          </tr>
          <tr>
            <td style="padding:8px; border-bottom:1px solid #eee;"><b>Check-Out:</b></td>
            <td style="padding:8px; border-bottom:1px solid #eee;">${outDate.toDateString()}</td>
          </tr>
          <tr>
            <td style="padding:8px;"><b>Amount:</b></td>
            <td style="padding:8px;"><b>${Number(amount).toFixed(2)}</b></td>
          </tr>
        </table>
        <p style="margin-top:20px;">Our admin will review and confirm your booking shortly.</p>
        <p>Thank you for choosing <b>Local Service Booker</b>!</p>
      `,
            "#28a745" // ✅ green header
        );

        await sendBrandedEmail(user.email, customerSubject, customerHtml);

        // 💌 2️⃣ Admin alert email (Blue)
        if (process.env.ADMIN_EMAIL) {
            const adminSubject = `📢 New Booking Received - ${service.name}`;
            const adminHtml = buildBrandedEmail(
                "New Booking Alert 🚀",
                `
          <p>Hello Admin,</p>
          <p>A new booking has been made:</p>
          <table style="width:100%; margin-top:10px; border-collapse:collapse;">
            <tr><td><b>Customer:</b></td><td>${user.name}</td></tr>
            <tr><td><b>Email:</b></td><td>${user.email}</td></tr>
            <tr><td><b>Service:</b></td><td>${service.name}</td></tr>
            <tr><td><b>Amount:</b></td><td>${Number(amount).toFixed(2)}</td></tr>
            <tr><td><b>Check-In:</b></td><td>${inDate.toDateString()}</td></tr>
            <tr><td><b>Check-Out:</b></td><td>${outDate.toDateString()}</td></tr>
          </table>
          <p style="margin-top:20px;">Please review and approve the booking.</p>
        `,
                "#007bff" // 💙 blue header
            );

            await sendBrandedEmail(process.env.ADMIN_EMAIL, adminSubject, adminHtml);
        }

        res.json({
            success: true,
            message: "Booking confirmed and emails sent successfully",
            booking,
        });
    } catch (error) {
        console.error("❌ Confirm booking error:", error);
        res.status(500).json({ message: error.message });
    }
};








/**
 * Stripe webhook handler
 * POST /api/payments/webhook
 */
export const stripeWebhookHandler = async (req, res) => {
    try {
        // Initialize Stripe here too
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: "2024-06-20",
        });

        const sig = req.headers["stripe-signature"];
        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body, // raw body (handled in route)
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.error("❌ Webhook signature verification failed:", err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        switch (event.type) {
            case "payment_intent.succeeded": {
                const intent = event.data.object;
                const bookingId = intent.metadata?.bookingId;
                if (bookingId) {
                    const booking = await Booking.findById(bookingId);
                    if (booking) {
                        booking.paymentStatus = "succeeded";
                        booking.status = "confirmed";
                        booking.paidAt = new Date();
                        await booking.save();
                        console.log(`✅ Booking ${bookingId} confirmed.`);
                    }
                }
                break;
            }

            case "payment_intent.payment_failed": {
                const intent = event.data.object;
                const bookingId = intent.metadata?.bookingId;
                if (bookingId) {
                    const booking = await Booking.findById(bookingId);
                    if (booking) {
                        booking.paymentStatus = "failed";
                        booking.status = "pending";
                        await booking.save();
                        console.log(`⚠️ Booking ${bookingId} marked failed.`);
                    }
                }
                break;
            }

            default:
                console.log(`ℹ️ Unhandled webhook event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (err) {
        console.error("❌ Stripe webhook handler error:", err);
        res.status(500).send("Server error");
    }
};
