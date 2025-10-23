import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../pages/axiosInstance"; // ✅ use your axiosInstance
import "../../styles/ManualBooking.css";

export default function ManualBooking() {
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    userId: "",
    serviceId: "",
    checkIn: "",
    checkOut: "",
    status: "pending",
  });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  // ✅ Load users and services
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, servicesRes] = await Promise.all([
          axiosInstance.get("/admin/users"),
          axiosInstance.get("/admin/services"),
        ]);

        // ✅ Defensive handling
        setUsers(usersRes.data?.users || []);
        setServices(Array.isArray(servicesRes.data) ? servicesRes.data : []);
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load users or services");
      }
    };
    fetchData();
  }, [token]);

  // ✅ Handle change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.userId || !form.serviceId || !form.checkIn || !form.checkOut) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post("/admin/manual-booking", form);
      toast.success(res.data.message || "Booking created successfully!");
      setForm({
        userId: "",
        serviceId: "",
        checkIn: "",
        checkOut: "",
        status: "pending",
      });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manual-booking-container">
      <h2>Manual Booking (Admin)</h2>

      <form onSubmit={handleSubmit} className="manual-booking-form">
        {/* User */}
        <div>
          <label>Select User</label>
          <select name="userId" value={form.userId} onChange={handleChange}>
            <option value="">-- Choose a User --</option>
            {Array.isArray(users) &&
              users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email})
                </option>
              ))}
          </select>
        </div>

        {/* Service */}
        <div>
          <label>Select Service</label>
          <select name="serviceId" value={form.serviceId} onChange={handleChange}>
            <option value="">-- Choose a Service --</option>
            {Array.isArray(services) &&
              services.map((s) => (
                <option key={s._id} value={s._id} disabled={!s.isAvailable}>
                  {s.name} {s.isAvailable ? "" : " (Unavailable)"}
                </option>
              ))}
          </select>
        </div>

        {/* Dates */}
        <div className="date-grid">
          <div>
            <label>Check-In</label>
            <input type="date" name="checkIn" value={form.checkIn} onChange={handleChange} />
          </div>
          <div>
            <label>Check-Out</label>
            <input type="date" name="checkOut" value={form.checkOut} onChange={handleChange} />
          </div>
        </div>

        {/* Status */}
        <div>
          <label>Status</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Booking"}
        </button>
      </form>
    </div>
  );
}
