// src/pages/user/Home.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../pages/axiosInstance";
import {
  FaUserCircle,
  FaClipboardList,
  FaBell,
  FaPlusCircle,
} from "react-icons/fa";
import "../../styles/Home.css";
import Swal from "sweetalert2";

export default function Home() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "{}")
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
  });
  const [recent, setRecent] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // ✅ Sync user data in case updated in another tab
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(updatedUser);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // ✅ Fetch real-time user info
  const fetchUserInfo = async () => {
    try {
      const { data } = await API.get("/user/profile");
      if (data) {
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Failed to fetch user info:", err);
    }
  };

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await API.get("/user/dashboard");
      const {
        totalBookings = 0,
        pendingBookings = 0,
        completedBookings = 0,
        cancelledBookings = 0,
        recentBookings = [],
      } = data || {};

      const cancelledCount =
        typeof cancelledBookings === "number"
          ? cancelledBookings
          : (recentBookings || []).filter(
              (b) => b.status?.toLowerCase() === "cancelled"
            ).length;

      setStats({
        total: totalBookings,
        pending: pendingBookings,
        completed: completedBookings,
        cancelled: cancelledCount,
      });
      setRecent(recentBookings || []);
      setUpcoming(
        (recentBookings || [])
          .filter((b) => new Date(b.date) >= new Date())
          .slice(0, 3)
      );

      const alerts = [];
      if (pendingBookings > 0)
        alerts.push(`You have ${pendingBookings} pending bookings!`);
      if (completedBookings > 0)
        alerts.push("Great job! Some bookings are completed.");
      if (cancelledCount > 0)
        alerts.push("Some bookings were cancelled recently.");
      setNotifications(alerts);
    } catch (err) {
      setError("Could not load your dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
    fetchDashboard();
  }, []);

  const quickActions = [
    {
      label: "Book Service",
      icon: <FaPlusCircle />,
      onClick: () => navigate("/user/service"),
    },
    {
      label: "My Bookings",
      icon: <FaClipboardList />,
      onClick: () => navigate("/user/booking"),
    },
    {
      label: "Profile",
      icon: <FaUserCircle />,
      onClick: () => navigate("/user/profile"),
    },
  ];

  

  return (
    <div className="home-container">
      {/* Header */}
      <div className="home-header">
        <div className="greeting">
          <h1 className="home-title">
            {getGreeting()}
            {user?.name ? `, ${user.name}` : ""} 👋
          </h1>
          <p>Welcome back! Here’s your dashboard summary.</p>
        </div>
        <div className="user-avatar">
          {user?.profilePic ? (
            <img src={`http://localhost:5000${user.profilePic}`} alt="Profile" />
          ) : (
            <FaUserCircle className="avatar-icon" />
          )}
        </div>
      </div>

      {/* for moblie view  */}

         <div className="home-header2">
          <div className="user-avatar">
          {user?.profilePic ? (
            <img src={`http://localhost:5000${user.profilePic}`} alt="Profile" />
          ) : (
            <FaUserCircle className="avatar-icon" />
          )}
        </div>
        <div className="greeting">
          <h1 className="home-title">
            {getGreeting()}
            {user?.name ? `, ${user.name}` : ""} 👋
          </h1>
          <p>Welcome back! Here’s your dashboard summary.</p>
        </div>
        
      </div>



      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="notification-card">
          <FaBell className="notif-icon" />
          <div>
            {notifications.map((n, index) => (
              <p key={index}>{n}</p>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        {quickActions.map((action, idx) => (
          <button key={idx} className="action-btn" onClick={action.onClick}>
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: "Total", value: stats.total ,class: "total" },
          { label: "Pending", value: stats.pending, class: "pending" },
          { label: "Completed", value: stats.completed, class: "completed" },
          { label: "Cancelled", value: stats.cancelled, class: "cancelled" },
        ].map((stat, i) => (
          <div key={i} className={`stat-card ${stat.class}`}>
            <span className="stat-value">
              {loading ? <div className="skeleton skeleton-text" /> : stat.value}
            </span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Upcoming Bookings */}
      <div className="upcoming-section">
        <h2>Upcoming Bookings</h2>
        {loading ? (
          <div className="skeleton skeleton-box" />
        ) : upcoming.length === 0 ? (
          <p className="muted">No upcoming bookings.</p>
        ) : (
          <ul className="upcoming-list">
            {upcoming.map((b) => (
              <li key={b._id}>
                <span className="icon">📅</span>
                <div>
                  <p>{b.serviceName}</p>
                  <small>
                    {new Date(b.date).toLocaleDateString()} - {b.status}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      


      {/* Recent Bookings */}
      <div className="recent-section">
        <h2>Recent Bookings</h2>
        {loading ? (
          <div className="recent-grid">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="recent-card skeleton-box" />
            ))}
          </div>
        ) : error ? (
          <p className="error">{error}</p>
        ) : recent.length === 0 ? (
          <p>No recent bookings. Start by booking a service.</p>
        ) : (
          <div className="recent-grid">
            {recent.map((b) => (
              <div key={b._id} className="recent-card">
                <p>{b.serviceName}</p>
                <small>
                  {new Date(b.date).toLocaleDateString()} - {b.status}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Section */}
<div className="feedback-section">
  <h2>We Value Your Feedback</h2>
  <p>Tell us how we can improve your experience.</p>

  <textarea
    id="feedback-input"
    placeholder="Share your feedback..."
    rows="3"
    className="feedback-box"
  ></textarea>

  <button
  className="action-btn"
  onClick={async () => {
    const feedback = document.getElementById("feedback-input").value.trim();

    if (!feedback) {
      Swal.fire({
        toast: true,
        icon: "warning",
        title: "Please write your feedback before sending!",
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
      return;
    }

    try {
      await API.post("/feedback", { message: feedback });

      Swal.fire({
        toast: true,
        icon: "success",
        title: "Thank you! Your feedback has been received 💬",
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      document.getElementById("feedback-input").value = "";
    } catch (error) {
      console.error("❌ Error submitting feedback:", error);
      Swal.fire({
        toast: true,
        icon: "error",
        title: "Something went wrong. Try again!",
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  }}
>
  Send Feedback
</button>

</div>


    </div>
  );
}
