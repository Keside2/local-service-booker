import React, { useEffect, useState } from "react";
import API from "../axiosInstance";
import Swal from "sweetalert2";
import "../../styles/Feedback.css";

export default function MyFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);

  const fetchMyFeedbacks = async () => {
    try {
      const { data } = await API.get("/feedback/my-feedback");
      setFeedbacks(data);
    } catch (error) {
      console.error("Error loading feedbacks:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to load feedbacks",
        text: "Please try again later.",
      });
    }
  };

  

  useEffect(() => {
      fetchMyFeedbacks();
      const interval = setInterval(fetchMyFeedbacks, 12000);
      return () => clearInterval(interval);
    }, []);

  return (
    <div className="my-feedback-container">
      <h2>My Feedback</h2>
      <p>Here’s what you’ve shared with us and any admin responses.</p>

      {feedbacks.length === 0 ? (
        <p className="no-feedback">You haven’t sent any feedback yet.</p>
      ) : (
        <div className="my-feedback-list">
          {feedbacks.map((fb) => (
            <div key={fb._id} className="my-feedback-card">
              <div className="feedback-main">
                <p className="message">🗨️ {fb.message}</p>
                <small className="time">
                  Sent on {new Date(fb.createdAt).toLocaleString()}
                </small>
              </div>

              {fb.reply?.message ? (
                <div className="reply-box">
                  <p>
                    <strong>Admin Reply:</strong> {fb.reply.message}
                  </p>
                  <small>
                    Replied: {new Date(fb.reply.repliedAt).toLocaleString()}
                  </small>
                </div>
              ) : (
                <p className="pending-reply">Awaiting admin reply...</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
