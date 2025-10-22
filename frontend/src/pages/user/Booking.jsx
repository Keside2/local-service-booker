// src/pages/user/Bookings.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../pages/axiosInstance";
import Swal from "sweetalert2";
import "../../styles/Booking.css";
import { useCurrency } from "../../context/CurrencyContext";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 12;
  const navigate = useNavigate();
  const { symbol } = useCurrency();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await API.get("/user/bookings");
      setBookings(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load bookings", "error");
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this action!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel it!",
      cancelButtonText: "No, keep it",
    });

    if (confirm.isConfirmed) {
      try {
        await API.delete(`/user/bookings/${id}`);
        Swal.fire("Cancelled!", "Your booking has been cancelled.", "success");
        fetchBookings();
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to cancel booking", "error");
      }
    }
  };

  const goToCheckout = (booking) => {
    navigate("/user/checkout", {
      state: {
        serviceId: booking.service?._id,
        serviceName: booking.service?.name,
        amount: booking.price || booking.service?.price,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        days: calculateDays(booking.checkIn, booking.checkOut),
      },
    });
  };

  const calculateDays = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = bookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const totalPages = Math.ceil(bookings.length / bookingsPerPage);

  if (loading) return <p>Loading bookings...</p>;

  return (
    <div className="bookings-container">
      <h1>Your Bookings</h1>
      {bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        <>
          <div className="bookings-grid">
            {currentBookings.map((b) => {
              const hasRange = b.checkIn && b.checkOut;
              const duration = hasRange ? calculateDays(b.checkIn, b.checkOut) : b.duration || 0;

              return (
                <div className="booking-card" key={b._id}>
                  <h3>{b.service?.name || "Unknown Service"}</h3>

                  {hasRange ? (
                    <>
                      <p>
                        <strong>Check-In:</strong>{" "}
                        {new Date(b.checkIn).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Check-Out:</strong>{" "}
                        {new Date(b.checkOut).toLocaleDateString()}
                      </p>
                      {duration > 0 && (
                        <p>
                          <strong>Duration:</strong> {duration} day
                          {duration > 1 ? "s" : ""}
                        </p>
                      )}
                    </>
                  ) : (
                    <p>
                      <strong>Date:</strong>{" "}
                      {b.date
                        ? new Date(b.date).toLocaleDateString()
                        : "N/A"}
                    </p>
                  )}

                  <p>
                    <strong>Status:</strong>{" "}
                    <span className={`status-badge ${b.status.toLowerCase()}`}>
                      {b.status}
                    </span>
                  </p>

                  <p>
                    <strong>Price:</strong> {symbol}{b.price || b.service?.price}
                  </p>

                  {(b.status === "pending" || b.status === "confirmed") && (
                    <button
                      className="cancel-btn"
                      onClick={() => cancelBooking(b._id)}
                    >
                      Cancel Booking
                    </button>
                  )}

                  {/* {b.paymentStatus !== "succeeded" && (
                    <button className="pay-btn" onClick={() => goToCheckout(b)}>
                      Pay Now
                    </button>
                  )} */}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
