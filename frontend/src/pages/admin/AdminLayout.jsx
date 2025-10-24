import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "../../styles/AdminDashboard.css";

// ✅ Dynamic backend URL
const backendURL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://local-service-booker-api.onrender.com");

export default function AdminLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [storedUser, setStoredUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "{}")
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const updatedUser = JSON.parse(localStorage.getItem("user") || "{}");
      setStoredUser((prev) =>
        JSON.stringify(prev) !== JSON.stringify(updatedUser)
          ? updatedUser
          : prev
      );
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <>
      <button className="menu-toggle" onClick={toggleSidebar}>
        <i className={isSidebarOpen ? "fas fa-times" : "fas fa-bars"}></i>
      </button>

      <div className={`overlay ${isSidebarOpen ? "show" : ""}`} onClick={closeSidebar}></div>

      <div className="admin-container">
        <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
          <h2>Admin Panel</h2>

          <div className="sidebar-profile">
            <img
              src={
                storedUser?.logo
                  ? `${backendURL}${storedUser.logo}`
                  : "/default-avatar.png"
              }
              alt="Admin"
              className="sidebar-avatar"
            />
            <p className="sidebar-username">{storedUser?.name || "Admin"}</p>
          </div>

          {/* ... sidebar navigation unchanged ... */}

          <button onClick={handleLogout} className="logout-btn">
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>

        <div className="main-content">
          <Outlet />
        </div>
      </div>
    </>
  );
}
