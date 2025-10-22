// utils/autoReenableServices.js
import Service from "../models/Service.js";

export const autoReenableServices = async () => {
    try {
        const now = new Date();

        // Find expired unavailable services
        const result = await Service.updateMany(
            { isAvailable: false, bookedUntil: { $lt: now } },
            { $set: { isAvailable: true, bookedUntil: null } }
        );

        if (result.modifiedCount > 0) {
            console.log(`✅ Auto-reenabled ${result.modifiedCount} expired services`);
        }
    } catch (err) {
        console.error("Auto-reenable error:", err.message);
    }
};
