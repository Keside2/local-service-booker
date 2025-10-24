import React, { useEffect, useState } from "react";
import "./Bookings.css";
import API from "../api";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.bookings || [];
      setBookings(data);
      setFilteredBookings(data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    filterBookings(value, statusFilter);
  };

  const handleStatusFilter = (e) => {
    const value = e.target.value;
    setStatusFilter(value);
    filterBookings(searchTerm, value);
  };

  const filterBookings = (search, status) => {
    let filtered = [...bookings];
    if (search) {
      filtered = filtered.filter(
        (booking) =>
          booking.user?.name.toLowerCase().includes(search) ||
          booking.service?.name.toLowerCase().includes(search)
      );
    }
    if (status) filtered = filtered.filter((b) => b.status === status);
    setFilteredBookings(filtered);
    setCurrentPage(1);
  };

  const openEditModal = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedBooking(null);
    setShowModal(false);
  };

  const updateBookingStatus = async (id, newStatus) => {
    try {
      await API.put(
        `/admin/bookings/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBookings();
      closeModal();
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("Failed to update booking. Please try again.");
    }
  };

  const deleteBooking = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    try {
      await API.delete(`/admin/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBookings();
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <p>Loading bookings...</p>;

  return (
    <div className="bookings-container">
      <h1 className="bookings-title">Manage Bookings</h1>

      {/* Filters */}
      <div className="bookings-filters">
        <input
          type="text"
          placeholder="Search by user or service..."
          value={searchTerm}
          onChange={handleSearch}
        />

        <select value={statusFilter} onChange={handleStatusFilter}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
        >
          <option value="5">5 per page</option>
          <option value="10">10 per page</option>
          <option value="15">15 per page</option>
        </select>
      </div>

      {/* ✅ Table View */}
      <div className="bookings-table-container">
        {currentBookings.length > 0 ? (
          <table className="bookings-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Service</th>
                <th>Date</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentBookings.map((booking) => (
                <tr key={booking._id}>
                  <td>{booking.user?.name || "N/A"}</td>
                  <td>{booking.service?.name || "N/A"}</td>
                  <td>{new Date(booking.date).toLocaleDateString()}</td>
                  <td>{booking.status}</td>
                  <td>₦{booking.amount?.toLocaleString()}</td>
                  <td>
                    <button className="edit-btn" onClick={() => openEditModal(booking)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => deleteBooking(booking._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No bookings found.</p>
        )}
      </div>

      {/* ✅ Mobile Cards */}
      <div className="bookings-cards">
        {currentBookings.map((booking) => (
          <div className="booking-card" key={booking._id}>
            <h3>{booking.service?.name}</h3>
            <p><strong>User:</strong> {booking.user?.name}</p>
            <p><strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}</p>
            <p><strong>Status:</strong> {booking.status}</p>
            <p><strong>Amount:</strong> ₦{booking.amount?.toLocaleString()}</p>
            <div className="booking-actions">
              <button className="edit-btn" onClick={() => openEditModal(booking)}>Edit</button>
              <button className="delete-btn" onClick={() => deleteBooking(booking._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={currentPage === i + 1 ? "active" : ""}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* ✅ Edit Modal */}
      {showModal && selectedBooking && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit Booking</h2>
            <p>
              <strong>User:</strong> {selectedBooking.user?.name} <br />
              <strong>Service:</strong> {selectedBooking.service?.name}
            </p>
            <select
              value={selectedBooking.status}
              onChange={(e) =>
                setSelectedBooking({ ...selectedBooking, status: e.target.value })
              }
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="modal-buttons">
              <button onClick={() => updateBookingStatus(selectedBooking._id, selectedBooking.status)}>
                Save
              </button>
              <button onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
