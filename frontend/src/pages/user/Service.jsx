// src/pages/user/Service.jsx
import React, { useEffect, useState, useCallback } from "react";
import API from "../../pages/axiosInstance";
import "../../styles/Service.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "../../context/CurrencyContext";

export default function Service() {
  const [services, setServices] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const servicesPerPage = 12;
  const navigate = useNavigate();
    const { currency, symbol } = useCurrency();
console.log("💰 Current currency:", currency, "Symbol:", symbol);


  // ✅ Fetch services + active bookings
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [svcRes, activeRes] = await Promise.all([
        API.get("/user/services"),
        API.get("/bookings/active"),
      ]);
      setServices(svcRes.data || []);
      setActiveBookings(activeRes.data || []);
    } catch (err) {
      console.error("Error fetching services or active bookings:", err);
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // ✅ Helper to check availability
  const isBookingActive = (booking) => {
    const now = new Date();
    if (!booking) return false;
    if (booking.checkOut) return new Date(booking.checkOut) >= now;
    if (booking.date)
      return (
        new Date(booking.date) >=
        new Date(now.getFullYear(), now.getMonth(), now.getDate())
      );
    return true;
  };

  const getStatusStyle = (service) => {
    const now = new Date();
    if (service.bookedUntil && new Date(service.bookedUntil) < now) {
      return { bg: "green", label: "Available" };
    }
    const booking = activeBookings.find((b) => {
      const bookingServiceId = b.service?._id || b.service;
      return (
        String(bookingServiceId) === String(service._id) &&
        b.status !== "cancelled" &&
        isBookingActive(b)
      );
    });

    if (booking) {
      const st = (booking.status || "").toLowerCase();
      if (st === "pending")
        return { bg: "yellow", label: "Pending Confirmation" };
      if (["approved", "confirmed", "completed"].includes(st))
        return { bg: "red", label: "Occupied" };
      if (st === "cancelled") return { bg: "green", label: "Available" };
    }

    if (service.isAvailable) return { bg: "green", label: "Available" };
    return { bg: "red", label: "Unavailable" };
  };

  // ✅ Handle date changes
  const handleDateChange = (serviceId, name, value) => {
    setSelectedDates((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [name]: value,
      },
    }));
  };

  // ✅ Calculate number of days between two dates
  const calculateDays = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  // ✅ Handle booking
  const handleBook = (service) => {
    const { checkIn, checkOut } = selectedDates[service._id] || {};
    if (!checkIn || !checkOut) {
      toast.warning("Please select both check-in and check-out dates");
      return;
    }

    const days = calculateDays(checkIn, checkOut);
    const totalAmount = service.price * days;

    navigate(`/user/checkout`, {
      state: {
        serviceId: service._id,
        serviceName: service.name,
        amount: totalAmount,
        checkIn,
        checkOut,
        days,
      },
    });
  };

  if (loading) return <p className="loading-text">Loading services...</p>;

  const indexOfLastService = currentPage * servicesPerPage;
  const currentServices = services.slice(
    indexOfLastService - servicesPerPage,
    indexOfLastService
  );
  const totalPages = Math.ceil(services.length / servicesPerPage);

  return (
    <div className="service-container">
      <h1 className="page-title">Available Services</h1>

      <div className="service-grid">
        {currentServices.length === 0 ? (
          <p>No services available</p>
        ) : (
          currentServices.map((s) => {
            const status = getStatusStyle(s);
            const selected = selectedDates[s._id] || {};
            const days =
              selected.checkIn && selected.checkOut
                ? calculateDays(selected.checkIn, selected.checkOut)
                : 0;
            const total = days * s.price;

            return (
              <div
                key={s._id}
                className="service-card"
                style={{
                  backgroundColor:
                    status.bg === "green"
                      ? "#e6ffed"
                      : status.bg === "red"
                      ? "#ffe6e6"
                      : "#fff7cc",
                  border:
                    status.bg === "red"
                      ? "2px solid red"
                      : status.bg === "green"
                      ? "2px solid #4CAF50"
                      : "2px solid orange",
                }}
              >
                <h3>{s.name}</h3>
                <p>{s.description}</p>
                <p className="service-price">{symbol}{s.price}/day</p>

                <p
                  style={{
                    fontWeight: "bold",
                    color:
                      status.bg === "green"
                        ? "green"
                        : status.bg === "red"
                        ? "red"
                        : "orange",
                  }}
                >
                  {status.label}
                </p>

                {status.bg === "green" ? (
                  <>
                    {/* ✅ New Date Grid */}
                    <div className="date-grid">
                      <div>
                        <label>Check-In</label>
                        <input
                          type="date"
                          name="checkIn"
                          value={selected.checkIn || ""}
                          onChange={(e) =>
                            handleDateChange(s._id, "checkIn", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label>Check-Out</label>
                        <input
                          type="date"
                          name="checkOut"
                          value={selected.checkOut || ""}
                          onChange={(e) =>
                            handleDateChange(s._id, "checkOut", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    {days > 0 && (
                      <p style={{ marginTop: "8px", fontWeight: "500" }}>
  Total: <b>{symbol}{total.toFixed(2)}</b> for {days} day{days > 1 ? "s" : ""}
</p>

                    )}

                    <button className="book-btn" onClick={() => handleBook(s)}>
                      Book Now
                    </button>
                  </>
                ) : (
                  <button
                    className="book-btn"
                    disabled
                    style={{
                      backgroundColor:
                        status.bg === "yellow"
                          ? "orange"
                          : status.bg === "red"
                          ? "red"
                          : "#ccc",
                      cursor: "not-allowed",
                    }}
                  >
                    {status.label}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
