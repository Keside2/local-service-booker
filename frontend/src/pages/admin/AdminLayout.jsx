import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "../../styles/AdminDashboard.css";
import {
  FaTachometerAlt,
  FaUsers,
  FaCogs,
  FaCalendarCheck,
  FaCalendarPlus,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

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

  // ✅ Keep admin info synced (every 500ms)
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
      {/* ✅ Hamburger Button */}
      <button className="menu-toggle" onClick={toggleSidebar}>
        <i className={isSidebarOpen ? "fas fa-times" : "fas fa-bars"}></i>
      </button>

      {/* ✅ Overlay for Mobile */}
      <div
        className={`overlay ${isSidebarOpen ? "show" : ""}`}
        onClick={closeSidebar}
      ></div>

      <div className="admin-container">
        {/* ✅ Sidebar */}
        <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
          <h2>Admin Panel</h2>

          {/* ✅ Admin Profile Section */}
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

          {/* ✅ Sidebar Navigation */}
          <ul>
            <li>
              <NavLink
                to="/admin/dashboard"
                onClick={closeSidebar}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                 <i className="fas fa-tachometer-alt"></i> Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/users"
                onClick={closeSidebar}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className="fas fa-users"></i> Users
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/services"
                onClick={closeSidebar}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className="fas fa-cogs"></i> Services
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/bookings"
                onClick={closeSidebar}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className="fas fa-calendar-check"></i> Bookings
              </NavLink>
            </li>
      
            <li>
              <NavLink
                to="/admin/manual-booking"
                onClick={closeSidebar}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className="fas fa-calendar-plus"></i> Manual Booking
              </NavLink>
            </li>

            <li>
    <NavLink
      to="/admin/feedback"
      onClick={closeSidebar}
      className={({ isActive }) => (isActive ? "active" : "")}
    >
      <i className="fas fa-comment-dots"></i> Feedback
    </NavLink>
  </li>

            
            <li>
              <NavLink
                to="/admin/settings"
                onClick={closeSidebar}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
               <i className="fas fa-cog"></i> Settings
              </NavLink>
            </li>
          </ul>

          {/* ✅ Logout Button */}
          <button onClick={handleLogout} className="logout-btn">
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>

        {/* ✅ Main Dynamic Content */}
        <div className="main-content">
          <Outlet />
        </div>
      </div>
    </>
  );
}
