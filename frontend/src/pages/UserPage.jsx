import React, { useEffect, useState } from "react";
import axios from "../pages/axiosInstance";

export default function UserPage() {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const token = localStorage.getItem("token");

  // Fetch all services
  const fetchServices = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/services", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setServices(res.data);
    } catch (err) {
      console.error("Error fetching services:", err.response?.data || err.message);
    }
  };

  // Fetch bookings for logged-in user
  const fetchBookings = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/bookings/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(res.data);
    } catch (err) {
      console.error("Error fetching bookings:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchBookings();
  }, []);

  // Book a service
  const handleBook = async (service) => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/bookings",
        {
          service: service._id,
          date: new Date().toISOString(),
          price: service.price,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Booking successful!");
      fetchBookings(); // Refresh user bookings
    } catch (err) {
      console.error("Booking error:", err.response?.data || err.message);
      alert("Booking failed.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>User Dashboard</h1>

      <h2>Available Services</h2>
      <ul>
        {services.map((service) => (
          <li key={service._id} style={{ margin: "10px 0" }}>
            <b>{service.name}</b> - ${service.price}
            <button
              style={{ marginLeft: "10px" }}
              onClick={() => handleBook(service)}
            >
              Book
            </button>
          </li>
        ))}
      </ul>

      <h2>My Bookings</h2>
      <ul>
        {bookings.map((booking) => (
          <li key={booking._id} style={{ margin: "10px 0" }}>
            <b>{booking.service.name}</b> - ${booking.price} -{" "}
            {new Date(booking.date).toLocaleString()} - Status: {booking.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
