import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "../../styles/UserLayout.css";
import { FaUserCircle } from "react-icons/fa";

export default function UserLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [storedUser, setStoredUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "{}")
  );

  // ✅ Sync when localStorage changes (e.g. profile update from another page)
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem("user") || "{}");
      setStoredUser(updatedUser);
    };

    window.addEventListener("storage", handleStorageChange);

    // ✅ Also keep a fast internal sync (every 500ms)
    const interval = setInterval(() => {
      const updatedUser = JSON.parse(localStorage.getItem("user") || "{}");
      setStoredUser((prev) =>
        JSON.stringify(prev) !== JSON.stringify(updatedUser) ? updatedUser : prev
      );
    }, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);
  const handleProfileClick = () => {
    closeSidebar();
    navigate("/user/profile");
  };

  return (
    <>
      {/* Hamburger Menu */}
      <button className="menu-toggle" onClick={toggleSidebar}>
        <i className={isSidebarOpen ? "fas fa-times" : "fas fa-bars"}></i>
      </button>

      {/* Overlay for mobile */}
      <div
        className={`overlay ${isSidebarOpen ? "show" : ""}`}
        onClick={closeSidebar}
      ></div>

      <div className="user-container">
        <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
          <h2>User Panel</h2>

          {/* ✅ Live-updating profile section */}
          <div className="sidebar-profile" onClick={handleProfileClick}>
            {storedUser?.profilePic ? (
              <img
                src={`http://localhost:5000${storedUser.profilePic}`}
                alt="Profile"
                className="sidebar-avatar"
              />
            ) : (
              <FaUserCircle className="sidebar-avatar placeholder" />
            )}
            <p className="sidebar-username">{storedUser?.name || "User"}</p>
          </div>

          {/* Navigation Links */}
          <ul>
            <li>
              <NavLink
                to="home"
                onClick={closeSidebar}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className="fas fa-home"></i> Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="service"
                onClick={closeSidebar}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className="fas fa-cogs"></i> Services
              </NavLink>
            </li>
            <li>
              <NavLink
                to="booking"
                onClick={closeSidebar}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className="fas fa-calendar-check"></i> Bookings
              </NavLink>
            </li>
            <li>
              <NavLink
                to="feedback"
                onClick={closeSidebar}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className="fas fa-comment-dots"></i> My Feedback
              </NavLink>
            </li>
            <li>
              <NavLink
                to="profile"
                onClick={closeSidebar}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className="fas fa-user"></i> Profile
              </NavLink>
            </li>

          </ul>

          {/* Logout Button */}
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
