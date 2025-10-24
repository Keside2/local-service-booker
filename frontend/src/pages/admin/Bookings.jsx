import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Bookings.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CSVLink } from "react-csv";
import { useCurrency } from "../../context/CurrencyContext";
import API from "../api";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const { symbol } = useCurrency();

  const token = localStorage.getItem("token");
  const API_URL = "http://localhost:5000/api/admin";

  useEffect(() => {
  fetchBookings();

  // 🔁 Refresh every 60 seconds
  const interval = setInterval(() => {
    fetchBookings();
  }, 60000); // 60 seconds = 60000 ms

  return () => clearInterval(interval); // cleanup on unmount
}, [currentPage, limit, sort, statusFilter, search]);


  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await API.get(`${API_URL}/bookings`, {
        params: { page: currentPage, limit, sort, status: statusFilter, search },
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(res.data.bookings || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  

  const handleSearch = (e) => setSearch(e.target.value);
  const handleStatusFilter = (e) => setStatusFilter(e.target.value);
  const handleSort = (e) => setSort(e.target.value);

  const handleSelectBooking = (id) => {
    setSelectedBookings((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await API.put(
        `${API_URL}/bookings/${bookingId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBookings();
    } catch (error) {
      console.error("Failed to update booking status:", error);
      toast.error("Failed to update status");
    }
  };

  const bulkAction = async (status) => {
    if (!selectedBookings.length)
      return toast.warning("Select at least one booking");
    try {
      await API.post(
        `${API_URL}/bookings/bulk-status`,
        { ids: selectedBookings, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Updated ${selectedBookings.length} bookings`);
      setSelectedBookings([]);
      fetchBookings();
    } catch (err) {
      console.error(err);
      toast.error("Bulk action failed");
    }
  };

  const bulkDelete = async () => {
    if (!window.confirm("Delete selected bookings?")) return;
    try {
      await API.post(
        `${API_URL}/bookings/bulk-delete`,
        { ids: selectedBookings },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Deleted selected bookings");
      setSelectedBookings([]);
      fetchBookings();
    } catch (err) {
      console.error("Bulk delete error:", err);
      toast.error("Failed to delete bookings");
    }
  };

  const deleteBooking = async (id) => {
    if (!window.confirm("Delete this booking?")) return;
    try {
      await API.delete(`${API_URL}/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Booking deleted");
      fetchBookings();
    } catch (err) {
      console.error("Delete booking error:", err);
      toast.error("Failed to delete booking");
    }
  };

  const openModal = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedBooking(null);
    setShowModal(false);
  };

  // ✅ CSV Export data
  const csvData = bookings.map((b) => ({
    User: b.user?.name || "N/A",
    Email: b.user?.email || "N/A",
    Service: b.service?.name || "N/A",
    Price: `$${b.price || b.service?.price || 0}`,
    "Check-In": b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "N/A",
    "Check-Out": b.checkOut ? new Date(b.checkOut).toLocaleDateString() : "N/A",
    Duration: b.checkIn && b.checkOut
      ? Math.max(
          1,
          Math.ceil((new Date(b.checkOut) - new Date(b.checkIn)) / (1000 * 60 * 60 * 24))
        ) + " day(s)"
      : "N/A",
    Status: b.status,
  }));

  if (loading)
    return (
      <div className="loader">
        <div className="spinner"></div>
        <p>Loading bookings...</p>
      </div>
    );

  return (
    <div className="bookings-section">
      <h1>Bookings</h1>

      {/* ✅ Top controls */}
      <div className="bookings-controls">
        <input
          type="text"
          placeholder="Search by customer or date..."
          value={search}
          onChange={handleSearch}
        />

        <select value={statusFilter} onChange={handleStatusFilter}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select value={sort} onChange={handleSort}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>

        {bookings.length > 0 && (
          <CSVLink data={csvData} filename="bookings-report.csv" className="export-btn">
            Export CSV
          </CSVLink>
        )}
      </div>

      {/* ✅ Bulk Actions */}
      {selectedBookings.length > 0 && (
        <div className="bulk-actions">
          <button onClick={() => bulkAction("pending")} className="actions1">
            🎯 Set Pending
          </button>
          <button onClick={() => bulkAction("completed")} className="actions2">
            ✅ Set Completed
          </button>
          <button onClick={bulkDelete} className="actions3">
            🗑️ Delete Selected
          </button>
        </div>
      )}

      {/* ✅ Table view (desktop) */}
      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={
                  selectedBookings.length === bookings.length && bookings.length > 0
                }
                onChange={() => {
                  if (selectedBookings.length === bookings.length)
                    setSelectedBookings([]);
                  else setSelectedBookings(bookings.map((b) => b._id));
                }}
              />
            </th>
            <th>Customer</th>
            <th>Service</th>
            <th>Check-In</th>
            <th>Check-Out</th>
            <th>Duration</th>
            <th>Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => {
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
              <tr key={b._id} className={b.status === "cancelled" ? "row-cancelled" : ""}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedBookings.includes(b._id)}
                    onChange={() => handleSelectBooking(b._id)}
                  />
                </td>
                <td>{b.user?.name}</td>
                <td>{b.service?.name}</td>
                <td>{b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "N/A"}</td>
                <td>{b.checkOut ? new Date(b.checkOut).toLocaleDateString() : "N/A"}</td>
                <td>{duration ? `${duration} day${duration > 1 ? "s" : ""}` : "N/A"}</td>
                <td>{symbol}{b.price || b.service?.price || 0}</td>

                <td>
                  {b.status !== "cancelled" ? (
                    <select
                      className="status-dropdown"
                      value={b.status}
                      onChange={(e) => handleStatusChange(b._id, e.target.value)}
                    >
                      <option value="pending">Pending</option>

                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  ) : (
                    <span className="badge-cancelled">Cancelled</span>
                  )}
                </td>

                <td>
                  <button onClick={() => openModal(b)}>View</button>
                  <button onClick={() => deleteBooking(b._id)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ✅ Mobile cards */}
      <div className="bookings-cards">
        {bookings.map((b) => {
          const duration =
            b.checkIn && b.checkOut
              ? Math.max(
                  1,
                  Math.ceil(
                    (new Date(b.checkOut) - new Date(b.checkIn)) / (1000 * 60 * 60 * 24)
                  )
                )
              : null;
          return (
            <div className="booking-card" key={b._id}>
              <h3>{b.user?.name}</h3>
              <p><strong>Service:</strong> {b.service?.name}</p>
              <p><strong>Check-In:</strong> {b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "N/A"}</p>
              <p><strong>Check-Out:</strong> {b.checkOut ? new Date(b.checkOut).toLocaleDateString() : "N/A"}</p>
              <p><strong>Duration:</strong> {duration ? `${duration} day${duration > 1 ? "s" : ""}` : "N/A"}</p>
              <p><strong>Price:</strong> {symbol}{b.price || b.service?.price}</p>
              <p><strong>Status:</strong> <span className={`status ${b.status}`}>{b.status}</span></p>
              <div className="card-actions">
                {b.status !== "cancelled" ? (
                  <select
                    className="status-dropdown"
                    value={b.status}
                    onChange={(e) => handleStatusChange(b._id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : (
                  <span className="badge-cancelled">Cancelled</span>
                )}
                <button onClick={() => openModal(b)}>View</button>
                <button onClick={() => deleteBooking(b._id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ Pagination */}
      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Previous
        </button>
        <span>Page {currentPage}</span>
        <button onClick={() => setCurrentPage((prev) => prev + 1)}>Next</button>
        <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
          <option value={15}>15 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      {/* ✅ Booking Details Modal */}
      {showModal && selectedBooking && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Booking Details</h2>
            <p><strong>Customer:</strong> {selectedBooking.user?.name}</p>
            <p><strong>Email:</strong> {selectedBooking.user?.email}</p>
            <p><strong>Service:</strong> {selectedBooking.service?.name}</p>
            <p><strong>Price:</strong> {symbol}{selectedBooking.price || selectedBooking.service?.price}</p>
            <p><strong>Check-In:</strong> {selectedBooking.checkIn ? new Date(selectedBooking.checkIn).toLocaleDateString() : "N/A"}</p>
            <p><strong>Check-Out:</strong> {selectedBooking.checkOut ? new Date(selectedBooking.checkOut).toLocaleDateString() : "N/A"}</p>
            {selectedBooking.checkIn && selectedBooking.checkOut && (
              <p>
                <strong>Duration:</strong>{" "}
                {Math.max(
                  1,
                  Math.ceil(
                    (new Date(selectedBooking.checkOut) - new Date(selectedBooking.checkIn)) /
                      (1000 * 60 * 60 * 24)
                  )
                )}{" "}
                day(s)
              </p>
            )}
            <p><strong>Status:</strong> {selectedBooking.status}</p>
            <p><strong>Description:</strong> {selectedBooking.service?.description || "No description"}</p>
            <div className="modal-actions">
              <button onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
