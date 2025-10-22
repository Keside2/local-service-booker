import express from "express";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
import {
    getAllServices,
    createService,
    updateService,
    deleteService,

} from "../controllers/serviceController.js";
import { getServices } from "../controllers/userController.js";
import { autoReenableServices } from "../utils/autoReenableServices.js";

const router = express.Router();

// ✅ Admin: Get all services
router.get("/", verifyToken, isAdmin, getAllServices);

router.get("/user/services", getServices);

// ✅ Admin: Create a new service
router.post("/", verifyToken, isAdmin, createService);

// ✅ Admin: Update a service
router.put("/:id", verifyToken, isAdmin, updateService);

// ✅ Admin: Delete a service
router.delete("/:id", verifyToken, isAdmin, deleteService);

router.get("/", async (req, res) => {
    await autoReenableServices(); // refresh availability first

    const services = await Service.find();
    res.json(services);
});

export default router;



































































































