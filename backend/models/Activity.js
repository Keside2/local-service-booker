import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        action: { type: String, required: true }, // e.g. "Changed password", "Booked Service X"
        meta: { type: Object, default: {} }, // optional extra data
        createdAt: { type: Date, default: Date.now },
        booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
    },
    { timestamps: true }
);

const Activity = mongoose.models.Activity || mongoose.model("Activity", activitySchema);
export default Activity;
