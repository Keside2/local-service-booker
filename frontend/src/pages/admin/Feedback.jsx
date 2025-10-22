import React, { useEffect, useState } from "react";
import API from "../../pages/axiosInstance";
import Swal from "sweetalert2";
import "../../styles/AdminFeedback.css";

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);

  const fetchFeedbacks = async () => {
    try {
      const { data } = await API.get("/feedback");
      setFeedbacks(data);
    } catch (error) {
      console.error("Error loading feedbacks:", error);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
    const interval = setInterval(fetchFeedbacks, 12000);
    return () => clearInterval(interval);
  }, []);
 

  const handleReply = async (id) => {
    const { value: reply } = await Swal.fire({
      title: "Reply to Feedback",
      input: "textarea",
      inputLabel: "Write your reply",
      inputPlaceholder: "Type your response here...",
      showCancelButton: true,
    });

    if (reply) {
      try {
        await API.put(`/feedback/${id}/reply`, { message: reply });
        Swal.fire({
          toast: true,
          icon: "success",
          title: "Reply sent!",
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
        });
        fetchFeedbacks();
      } catch (error) {
        Swal.fire("Error", "Could not send reply", "error");
      }
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This feedback will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await API.delete(`/feedback/${id}`);
        Swal.fire({
          toast: true,
          icon: "success",
          title: "Feedback deleted",
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
        });
        fetchFeedbacks();
      } catch (error) {
        Swal.fire("Error", "Could not delete feedback", "error");
      }
    }
  };

  return (
    <div className="admin-feedback-container">
      <h2>Feedback Management</h2>

      <div className="feedback-list">
        {feedbacks.length === 0 ? (
          <p className="no-feedback">No feedback yet.</p>
        ) : (
          feedbacks.map((fb) => (
            <div key={fb._id} className="feedback-card">
              <div className="feedback-header">
                <p>
                  <strong>{fb.user?.name}</strong> ({fb.user?.email})
                </p>
                <div className="feedback-actions">
                  {!fb.reply?.message && (
                    <button
                      className="reply-btn"
                      onClick={() => handleReply(fb._id)}
                    >
                      Reply
                    </button>
                  )}
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(fb._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="feedback-message">🗨️ {fb.message}</p>
              <small className="feedback-time">
                Sent: {new Date(fb.createdAt).toLocaleString()}
              </small>

              {fb.reply?.message && (
                <div className="reply-box">
                  <p>
                    <strong>Reply:</strong> {fb.reply.message}
                  </p>
                  <small>
                    Replied: {new Date(fb.reply.repliedAt).toLocaleString()}
                  </small>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
