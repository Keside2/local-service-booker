// src/components/PaymentForm.jsx
import React, { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import axios from "../pages/axiosInstance";
import "../styles/BookingCheckout.css";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "../context/CurrencyContext";

const PaymentForm = ({ serviceId, amount, date, timeSlot, checkIn, checkOut }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { symbol } = useCurrency();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!stripe || !elements) return;

    // Validate inputs
    if (!serviceId || !amount || (!date && !checkIn)) {
      setError("Missing required booking information. Please check your selection.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("User not authenticated. Please log in.");
        return;
      }

      // 1️⃣ Request PaymentIntent from backend
      const res = await axios.post(
        "/payments/create-payment-intent",
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { clientSecret } = res.data;

      // 2️⃣ Confirm card payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        setError(result.error.message);
        return; // ❌ stop here
      }

      if (result.paymentIntent.status === "succeeded") {
        // 3️⃣ After success, create booking
        const payload = {
          serviceId,
          amount,
          paymentIntentId: result.paymentIntent.id,
        };

        // include date range or single date
        if (checkIn && checkOut) {
          payload.checkIn = checkIn;
          payload.checkOut = checkOut;
        } else if (date && timeSlot) {
          payload.date = date;
          payload.timeSlot = timeSlot;
        }

        await axios.post("/payments/confirm-booking", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        Swal.fire({
          title: "Payment Successful 🎉",
          text: "Your payment has been processed successfully! Your booking is pending admin confirmation.",
          icon: "success",
          confirmButtonText: "Go to My Bookings",
        }).then(() => navigate("/user/booking"));
      }
    } catch (err) {
      console.error("Payment error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement className="StripeElement" />

      <button
        type="submit"
        disabled={!stripe || loading}
        className="checkout-btn"
      >
        {loading ? "Processing..." : `Pay ${symbol}${amount || 0}`}
      </button>

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
    </form>
  );
};

export default PaymentForm;
