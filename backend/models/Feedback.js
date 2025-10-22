import mongoose from "mongoose";


// if you want it to be a mini real-time chart use this 
// const feedbackSchema = new mongoose.Schema({
//     user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     messages: [
//         {
//             sender: { type: String, enum: ["user", "admin"], required: true },
//             text: { type: String, required: true },
//             createdAt: { type: Date, default: Date.now },
//             seen: { type: Boolean, default: false }
//         }
//     ],
//     updatedAt: { type: Date, default: Date.now }
// });


const feedbackSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    reply: {
        message: { type: String },
        repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
        repliedAt: { type: Date },
    },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Feedback", feedbackSchema);
