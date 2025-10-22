// import React, { useEffect, useState } from "react";
// import { NavLink, useNavigate } from "react-router-dom";
// import { FaTachometerAlt, FaUsers, FaCogs, FaBook, FaServicestack, FaSignOutAlt } from "react-icons/fa";


// export default function AdminSidebar() {
//   const navigate = useNavigate();
//   const [storedUser, setStoredUser] = useState(() =>
//     JSON.parse(localStorage.getItem("user"))
//   );

//   useEffect(() => {
//   const interval = setInterval(() => {
//     const updatedUser = JSON.parse(localStorage.getItem("user"));
//     setStoredUser(updatedUser);
//   }, 500); // check every 500ms

//   return () => clearInterval(interval);
// }, []);


//   const handleLogout = () => {
//     localStorage.removeItem("user");
//     navigate("/login");
//   };

//   return (
//     <div className="sidebar">
//       <div className="sidebar-header">
//         <img
//           src={
//             storedUser?.logo
//               ? `http://localhost:5000${storedUser.logo}`
//               : "/default-avatar.png"
//           }
//           alt="Profile"
//           className="sidebar-profile-pic"
//         />
//         <h2>{storedUser?.name || "Admin Panel"}</h2>
//       </div>

//       <ul>
//         <li>
//           <NavLink to="/admin/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
            
//             <i className="fas fa-tachometer-alt"></i> Dashboard
//           </NavLink>
//         </li>
//         <li>
//           <NavLink to="/admin/users" className={({ isActive }) => (isActive ? "active" : "")}>
//             <i className="fas fa-users"></i> Users
//           </NavLink>
//         </li>
//         <li>
//           <NavLink to="/admin/services" className={({ isActive }) => (isActive ? "active" : "")}>
//             <i className="fas fa-cogs"></i> Services
//           </NavLink>
//         </li>
//         <li>
//           <NavLink to="/admin/bookings" className={({ isActive }) => (isActive ? "active" : "")}>
//              <i className="fas fa-calendar-check"></i> Bookings
//           </NavLink>
//         </li>
//         <li>
//   <NavLink to="/admin/manual-booking" className={({ isActive }) => (isActive ? "active" : "")}>
//     <i className="fas fa-calendar-plus"></i> Manual Booking
//   </NavLink>
// </li>

//         <li>
//           <NavLink to="/admin/settings" className={({ isActive }) => (isActive ? "active" : "")}>
//            <i className="fas fa-cog"></i> Settings
//           </NavLink>
//         </li>
//       </ul>

//       <button onClick={handleLogout} className="logout-btn">
//         <FaSignOutAlt /> Logout
//       </button>
//     </div>
//   );
// }
