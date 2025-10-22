import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import Services from "./pages/admin/Services";
import Bookings from "./pages/admin/Bookings";
import Settings from "./pages/admin/Settings";

import BookingCheckout from "./pages/BookingCheckout";
import Home from "./pages/user/Home";
import Booking from "./pages/user/Booking";
import Service from "./pages/user/Service";
import Profile from "./pages/user/Profile";
import UserLayout from "./pages/user/UserLayout";

import PrivateRoute from "./components/PrivateRoute";
import UserRoute from "./components/UserRoute";

import "react-toastify/dist/ReactToastify.css";

import ManualBooking from "./pages/admin/ManualBooking";

import AdminFeedback from "./pages/admin/Feedback";

import MyFeedback from "./pages/user/Feedback";




// ✅ Stripe publishable key (from dashboard, not secret key!)
const stripePromise = loadStripe("pk_test_51S6C4FLezHIMtunfxM9PwTjOFZFAZq4A2YT8OaFC46yk7A3RGOaLtnx6QHsBcd2RIHrpZh8Kw8vz1d8qRfj2Jopf00xS4GkAaz");

function App() {
  return (
    <Elements stripe={stripePromise}>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} />

        <Routes>
          {/* ✅ Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* ✅ User Routes (Protected) */}
          <Route
            path="/user"
            element={
              <UserRoute>
                <UserLayout />
              </UserRoute>
            }
          >
            <Route path="home" element={<Home />} />
            <Route path="service" element={<Service />} />
            <Route path="booking" element={<Booking />} />
            <Route path="feedback" element={<MyFeedback />} />

            <Route path="profile" element={<Profile />} />

            {/* Checkout uses Stripe */}
            <Route path="checkout" element={<BookingCheckout />} />
          </Route>

          {/* ✅ Admin Routes (Protected) */}
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="services" element={<Services />} />
            <Route path="bookings" element={<Bookings />} />
             <Route path="manual-booking" element={<ManualBooking />} />
             <Route path="/admin/feedback" element={<AdminFeedback />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </Elements>
  );
}

export default App;
