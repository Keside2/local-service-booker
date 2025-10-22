import Feedback from "../models/Feedback.js";

// 🟢 User: Create Feedback
export const createFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.create({
            user: req.user._id,
            message: req.body.message,
        });
        res.status(201).json(feedback);
    } catch (error) {
        console.error("❌ Error creating feedback:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 🟣 Admin: Get all feedbacks
export const getAllFeedback = async (req, res) => {
    try {
        const feedbacks = await Feedback.find()
            .populate("user", "name email")
            .sort({ createdAt: -1 });
        res.json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: "Error fetching feedbacks" });
    }
};

// 🟠 Admin: Reply to feedback
export const replyToFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        const feedback = await Feedback.findById(id);
        if (!feedback) return res.status(404).json({ message: "Feedback not found" });

        feedback.reply = {
            message,
            repliedBy: req.user._id,
            repliedAt: new Date(),
        };

        await feedback.save();

        res.json({ message: "Reply sent successfully", feedback });
    } catch (error) {
        console.error("❌ Error replying:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 🟢 User: Get my feedbacks (with replies)
export const getUserFeedback = async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user feedback" });
    }
};


export const deleteFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findByIdAndDelete(req.params.id);
        if (!feedback) return res.status(404).json({ message: "Feedback not found" });
        res.json({ message: "Feedback deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting feedback" });
    }
};




// if you want it to be a mini real-time chart use this
// // POST /api/feedback/:id/message
// export const addMessageToFeedback = async (req, res) => {
//     const { id } = req.params;
//     const { text } = req.body;
//     const sender = req.user.role; // "user" or "admin"

//     try {
//         const feedback = await Feedback.findById(id);
//         if (!feedback) return res.status(404).json({ message: "Feedback not found" });

//         feedback.messages.push({ sender, text });
//         feedback.updatedAt = Date.now();
//         await feedback.save();

//         res.json(feedback);
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };
