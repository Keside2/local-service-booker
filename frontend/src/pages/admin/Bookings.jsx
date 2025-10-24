import React, { useEffect, useState } from "react";
import "./Bookings.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CSVLink } from "react-csv";
import { useCurrency } from "../../context/CurrencyContext";
import API from "../../api";

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

  // ✅ Fetch Bookings
  useEffect(() => {
    fetchBookings();

    // 🔁 Auto-refresh every 60s
    const interval = setInterval(fetchBookings, 60000);
    return () => clearInterval(interval);
  }, [currentPage, limit, sort, statusFilter, search]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/admin/bookings`, {
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

  // ✅ Filters
  const handleSearch = (e) => setSearch(e.target.value);
  const handleStatusFilter = (e) => setStatusFilter(e.target.value);
  const handleSort = (e) => setSort(e.target.value);

  // ✅ Selection
  const handleSelectBooking = (id) => {
    setSelectedBookings((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  // ✅ Update single booking status
  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await API.put(
        `/admin/bookings/${bookingId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBookings();
    } catch (error) {
      console.error("Failed to update booking status:", error);
      toast.error("Failed to update status");
    }
  };

  // ✅ Bulk Actions
  const bulkAction = async (status) => {
    if (!selectedBookings.length)
      return toast.warning("Select at least one booking");
    try {
      await API.post(
        `/admin/bookings/bulk-status`,
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
        `/admin/bookings/bulk-delete`,
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

  // ✅ Delete single booking
  const deleteBooking = async (id) => {
    if (!window.confirm("Delete this booking?")) return;
    try {
      await API.delete(`/admin/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Booking deleted");
      fetchBookings();
    } catch (err) {
      console.error("Delete booking error:", err);
      toast.error("Failed to delete booking");
    }
  };

  // ✅ Modal control
  const openModal = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedBooking(null);
    setShowModal(false);
  };

  // ✅ CSV Export
  const csvData = bookings.map((b) => ({
    User: b.user?.name || "N/A",
    Email: b.user?.email || "N/A",
    Service: b.service?.name || "N/A",
    Price: `${symbol}${b.price || b.service?.price || 0}`,
    "Check-In": b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "N/A",
    "Check-Out": b.checkOut ? new Date(b.checkOut).toLocaleDateString() : "N/A",
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
      <ToastContainer />
      <h1>Bookings</h1>

      {/* ✅ Top Controls */}
      <div className="bookings-controls">
        <input
          type="text"
          placeholder="Search by user or service..."
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

      {/* ✅ Table View */}
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
            <th>Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b._id} className={b.status === "cancelled" ? "row-cancelled" : ""}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedBookings.includes(b._id)}
                  onChange={() => handleSelectBooking(b._id)}
                />
              </td>
              <td>{b.user?.name || "N/A"}</td>
              <td>{b.service?.name || "N/A"}</td>
              <td>{b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "N/A"}</td>
              <td>{b.checkOut ? new Date(b.checkOut).toLocaleDateString() : "N/A"}</td>
              <td>{symbol}{b.price || b.service?.price || 0}</td>
              <td>
                {b.status !== "cancelled" ? (
                  <select
                    className="status-dropdown"
                    value={b.status}
                    onChange={(e) => handleStatusChange(b._id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
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
          ))}
        </tbody>
      </table>

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

      {/* ✅ Modal */}
      {showModal && selectedBooking && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Booking Details</h2>
            <p><strong>User:</strong> {selectedBooking.user?.name}</p>
            <p><strong>Email:</strong> {selectedBooking.user?.email}</p>
            <p><strong>Service:</strong> {selectedBooking.service?.name}</p>
            <p><strong>Price:</strong> {symbol}{selectedBooking.price || selectedBooking.service?.price}</p>
            <p><strong>Check-In:</strong> {selectedBooking.checkIn ? new Date(selectedBooking.checkIn).toLocaleDateString() : "N/A"}</p>
            <p><strong>Check-Out:</strong> {selectedBooking.checkOut ? new Date(selectedBooking.checkOut).toLocaleDateString() : "N/A"}</p>
            <p><strong>Status:</strong> {selectedBooking.status}</p>
            <div className="modal-actions">
              <button onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
