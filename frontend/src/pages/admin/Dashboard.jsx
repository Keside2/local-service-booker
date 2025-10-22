import "./Dashboard.css";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { CSVLink } from "react-csv";
import { useCurrency } from "../../context/CurrencyContext";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("dashboard_dark_mode") === "true"
  );

  const token = localStorage.getItem("token");
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const { symbol } = useCurrency();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
    if (storedUser?.role === "admin") {
      fetchUsers();
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [token, statusFilter, startDate, endDate]);

  useEffect(() => {
    localStorage.setItem("dashboard_dark_mode", String(darkMode));
  }, [darkMode]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await axios.get("http://localhost:5000/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setStats(res.data.stats || {});
      setAnalytics(res.data.analytics || {});
      setRecentBookings((res.data.recentBookings || []).slice(0, 5));
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  if (loading) return <p>Loading dashboard...</p>;
  if (!stats || !analytics) return <p>Failed to load dashboard data</p>;

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
  const chartData =
    analytics.bookingsMonthly?.map((item, index) => ({
      month: item.month,
      bookings: item.bookings,
      revenue: analytics.revenueMonthly ? (analytics.revenueMonthly[index]?.amount || 0) : 0,
    })) || [];

  const usersGrowthData = analytics.usersGrowth || [];
  const bookingsMonthlyData = analytics.bookingsMonthly || [];
  const revenueBreakdown = analytics.revenue || [];

  const csvData = recentBookings.map((booking) => ({
    User: booking.user?.name || "N/A",
    Service: booking.service?.name || "N/A",
    Date: new Date(booking.date).toLocaleDateString(),
    Status: booking.status,
  }));

  const axisStroke = darkMode ? "#cbd5e1" : "#374151";
  const gridStroke = darkMode ? "#334155" : "#e5e7eb";
  const lineBookings = "#8884d8";
  const lineRevenue = "#82ca9d";
  const barBookings = "#28a745";

  return (
    <div className={`dashboard-container ${darkMode ? "dark" : ""}`}>
      <div className="dash-header">
        {user && (
        <div className="profile-card">
          <h2>Welcome, {user.name}</h2>
          
        </div>
      )}

        <button
          type="button"
          className="dark-mode-toggle"
          onClick={() => setDarkMode((v) => !v)}
          aria-label="Toggle dark mode"
        >
          {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      
      {/* ✅ Filters */}
      <div className="filters-container">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

        {recentBookings.length > 0 && (
          <CSVLink data={csvData} filename="bookings-report.csv" className="export-btn">
            Export CSV
          </CSVLink>
        )}
      </div>

      {/* ✅ Stats */}
      <div className="stats-grid">
        <div className="card users-card">
          <i className="fas fa-users"></i>
          <h3>Total Users</h3>
          <p>{stats.totalUsers || 0}</p>
        </div>
        <div className="card services-card">
          <i className="fas fa-cogs"></i>
          <h3>Total Services</h3>
          <p>{stats.totalServices || 0}</p>
        </div>
        <div className="card bookings-card">
          <i className="fas fa-calendar-check"></i>
          <h3>Total Bookings</h3>
          <p>{stats.totalBookings || 0}</p>
        </div>
        <div className="card revenue-card">
          <i className="fas fa-dollar-sign"></i>
          <h3>Total Revenue</h3>
          <p>{symbol}{stats.totalRevenue || 0}</p>
        </div>
      </div>

      {/* ✅ Charts */}
      <div style={{ width: "100%", height: 400, marginTop: 50 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="month" stroke={axisStroke} />
            <YAxis stroke={axisStroke} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="bookings" stroke={lineBookings} name="Bookings" />
            <Line type="monotone" dataKey="revenue" stroke={lineRevenue} name="Revenue" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h3>Users Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usersGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="month" stroke={axisStroke} />
              <YAxis stroke={axisStroke} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#007bff" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Bookings Per Month</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bookingsMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="month" stroke={axisStroke} />
              <YAxis stroke={axisStroke} />
              <Tooltip />
              <Legend />
              <Bar dataKey="bookings" fill={barBookings} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
  <h3>Revenue Per Month</h3>
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={analytics.revenueMonthly || []}>
      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
      <XAxis dataKey="month" stroke={axisStroke} />
      <YAxis stroke={axisStroke} />
      <Tooltip formatter={(value) => `${symbol}${value.toLocaleString()}`} />
      <Legend />
      <Bar dataKey="amount" fill="#4F46E5" name="Revenue" />
    </BarChart>
  </ResponsiveContainer>
</div>

      </div>

      {/* ✅ Recent Bookings */}
      
<div className="recent-activity">
  <h2>Recent Bookings</h2>

  {recentBookings.length > 0 ? (
    <table>
      <thead>
        <tr>
          <th>User</th>
          <th>Service</th>
          <th>Check-In</th>
          <th>Check-Out</th>
          <th>Duration</th>
          <th>Price</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {recentBookings.map((booking, idx) => {
          const duration =
            booking.checkIn && booking.checkOut
              ? Math.max(
                  1,
                  Math.ceil(
                    (new Date(booking.checkOut) - new Date(booking.checkIn)) /
                      (1000 * 60 * 60 * 24)
                  )
                )
              : null;

          return (
            <tr key={idx} className={booking.status === "cancelled" ? "row-cancelled" : ""}>
              <td>{booking.user?.name || "N/A"}</td>
              <td>{booking.service?.name || "N/A"}</td>
              <td>
                {booking.checkIn
                  ? new Date(booking.checkIn).toLocaleDateString()
                  : "N/A"}
              </td>
              <td>
                {booking.checkOut
                  ? new Date(booking.checkOut).toLocaleDateString()
                  : "N/A"}
              </td>
              <td>{duration ? `${duration} day${duration > 1 ? "s" : ""}` : "N/A"}</td>
              <td>
                {symbol}
                {booking.price || booking.service?.price || 0}
              </td>
              <td>
                <span className={`status-badge status-${booking.status}`}>
                  {booking.status}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  ) : (
    <p>No recent bookings found.</p>
  )}
</div>


      {/* ✅ Mobile Cards */}
<div className="recent-bookings-cards">
  {recentBookings.map((b, idx) => {
    const duration =
      b.checkIn && b.checkOut
        ? Math.max(
            1,
            Math.ceil(
              (new Date(b.checkOut) - new Date(b.checkIn)) /
                (1000 * 60 * 60 * 24)
            )
          )
        : null;

    return (
      <div className="booking-card" key={idx}>
        <h3>{b.user?.name || "N/A"}</h3>
        <p><strong>Service:</strong> {b.service?.name || "N/A"}</p>
        <p><strong>Check-In:</strong> {b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "N/A"}</p>
        <p><strong>Check-Out:</strong> {b.checkOut ? new Date(b.checkOut).toLocaleDateString() : "N/A"}</p>
        <p><strong>Duration:</strong> {duration ? `${duration} day${duration > 1 ? "s" : ""}` : "N/A"}</p>
        <p><strong>Price:</strong> {symbol}{b.price || b.service?.price || 0}</p>
        <p><strong>Status:</strong> <span className={`status ${b.status}`}>{b.status}</span></p>
      </div>
    );
  })}
</div>


      
    </div>
  );
}








