import Service from "../models/Service.js";

/** ================================
 * ✅ Get All Services
 * ================================ */
export const getAllServices = async (req, res) => {
    try {
        const services = await Service.find().sort({ createdAt: -1 });
        res.json(services);
    } catch (error) {
        console.error("Error fetching services:", error.message);
        res.status(500).json({ message: "Failed to fetch services" });
    }
};

// ✅ New logic with current booking status
export const getServices = async (req, res) => {
    try {
        const services = await Service.find();

        const enriched = await Promise.all(
            services.map(async (s) => {
                const activeBooking = await Booking.findOne({
                    service: s._id,
                    status: { $in: ["pending", "approved", "completed"] },
                }).sort({ createdAt: -1 });

                return {
                    ...s.toObject(),
                    currentBookingStatus: activeBooking ? activeBooking.status : null,
                };
            })
        );

        res.json(enriched);
    } catch (error) {
        console.error("Error fetching services:", error);
        res.status(500).json({ message: "Server error" });
    }
};
/** ================================
 * ✅ Create a New Service
 * ================================ */
export const createService = async (req, res) => {
    try {
        console.log("Incoming data:", req.body); // ✅ Debug log

        const { name, price, description } = req.body;

        if (!name || !price) {
            return res.status(400).json({ message: "Name and price are required" });
        }

        // ✅ Ensure price is a valid number
        if (isNaN(price) || Number(price) <= 0) {
            return res.status(400).json({ message: "Price must be a positive number." });
        }

        const newService = new Service({
            name: name.trim(),
            price: Number(price),
            description: description?.trim() || "No description provided"
        });

        const savedService = await newService.save();
        return res.status(201).json({
            _id: savedService._id,
            name: savedService.name,
            price: savedService.price,
            description: savedService.description,
            createdAt: savedService.createdAt // ✅ Always included
        });
    } catch (error) {
        console.error("Create service error:", error.message);
        return res.status(500).json({ message: "Failed to create service" });
    }
};


/** ================================
 * ✅ Update Service
 * ================================ */
export const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, description } = req.body;

        if (!name || !price) {
            return res.status(400).json({ message: "Name and price are required" });
        }

        const updatedService = await Service.findByIdAndUpdate(
            id,
            {
                name: name.trim(),
                price: Number(price),
                description: description?.trim() || "No description provided"
            },
            { new: true, runValidators: true }
        );

        if (!updatedService) {
            return res.status(404).json({ message: "Service not found" });
        }

        return res.json(updatedService);
    } catch (error) {
        console.error("Error updating service:", error.message);
        return res.status(500).json({ message: "Failed to update service" });
    }
};

/** ================================
 * ✅ Delete Service
 * ================================ */
export const deleteService = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedService = await Service.findByIdAndDelete(id);

        if (!deletedService) {
            return res.status(404).json({ message: "Service not found" });
        }

        return res.json({ message: "Service deleted successfully" });
    } catch (error) {
        console.error("Error deleting service:", error.message);
        res.status(500).json({ message: "Failed to delete service" });
    }
};
