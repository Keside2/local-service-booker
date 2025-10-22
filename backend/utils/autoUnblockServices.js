import Booking from "../models/Booking.js";
import Service from "../models/Service.js";

export const autoUnblockServices = async () => {
    try {
        const now = new Date();

        // Find bookings that are completed or expired
        const expiredBookings = await Booking.find({
            checkOut: { $lt: now },
            status: { $in: ["approved", "completed"] },
        });

        for (const booking of expiredBookings) {
            const service = await Service.findById(booking.service);
            if (!service) continue;

            // Only free if there are no active overlapping bookings
            const hasActive = await Booking.exists({
                service: service._id,
                status: { $in: ["pending", "approved", "completed"] },
                checkOut: { $gt: now },
            });

            if (!hasActive) {
                service.isAvailable = true;
                service.bookedUntil = null;
                await service.save();
            }
            // Mark booking as completed
            if (booking.status !== "completed") {
                booking.status = "completed";
                await booking.save();
            }
        }

        console.log(
            `✅ Auto-cleanup completed: ${expiredBookings.length} bookings processed.`
        );
    } catch (error) {
        console.error("❌ Auto-cleanup error:", error.message);
    }




    // When admin updates booking status
    if (["completed", "cancelled"].includes(updatedBooking.status)) {
        const service = await Service.findById(updatedBooking.service);
        if (service) {
            service.isAvailable = true;
            service.bookedUntil = null;
            await service.save();
        }
    }

};
