// src/pages/BookingCheckout.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import PaymentForm from "../components/PaymentForm";
import "../styles/BookingCheckout.css";
import { useCurrency } from "../context/CurrencyContext";

// ⚡ Replace with your real publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const BookingCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
    const { symbol } = useCurrency();

  // ✅ Get booking info from state
  const booking = location.state;

  if (!booking) {
    return (
      <div className="p-4 text-red-500">
        ❌ Missing booking details. Please{" "}
        <button
          onClick={() => navigate("/user/service")}
          className="underline text-blue-600"
        >
          go back
        </button>{" "}
        and try again.
      </div>
    );
  }

  // ✅ Extract booking details
  const {
    serviceId,
    serviceName,
    amount,
    date,
    timeSlot,
    checkIn,
    checkOut,
    days,
  } = booking;

  // ✅ Choose how to display date
  const displayDate = checkIn && checkOut
    ? `${new Date(checkIn).toLocaleDateString()} → ${new Date(checkOut).toLocaleDateString()}`
    : date
    ? new Date(date).toLocaleDateString()
    : "Invalid Date";

  return (
    <Elements stripe={stripePromise}>
      <div className="checkout-container">
        <h1>Checkout</h1>

        {/* Booking Summary */}
        <div className="booking-summary">
          <p>
            <strong>Service:</strong> {serviceName || serviceId}
          </p>
          <p>
            <strong>Date:</strong> {displayDate}
          </p>
          {timeSlot && (
            <p>
              <strong>Time:</strong> {timeSlot}
            </p>
          )}
          {days && (
            <p>
              <strong>Duration:</strong> {days} day{days > 1 ? "s" : ""}
            </p>
          )}
          <p>
            <strong>Amount:</strong> {symbol}{amount}
          </p>
        </div>

        {/* Stripe Payment Form */}
        <PaymentForm
          serviceId={serviceId}
          amount={amount}
          date={date}
          timeSlot={timeSlot}
          checkIn={checkIn}
          checkOut={checkOut}
        />
      </div>
    </Elements>
  );
};

export default BookingCheckout;
