import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// 🔹 Auth pages
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

// 🔹 Admin pages
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import Services from "./pages/admin/Services";
import Bookings from "./pages/admin/Bookings";
import Settings from "./pages/admin/Settings";
import ManualBooking from "./pages/admin/ManualBooking";
import AdminFeedback from "./pages/admin/Feedback";

// 🔹 User pages
import UserLayout from "./pages/user/UserLayout";
import Home from "./pages/user/Home";
import Service from "./pages/user/Service";
import Booking from "./pages/user/Booking";
import BookingCheckout from "./pages/BookingCheckout";
import Profile from "./pages/user/Profile";
import MyFeedback from "./pages/user/Feedback";

// 🔹 Route guards
import PrivateRoute from "./components/PrivateRoute";
import UserRoute from "./components/UserRoute";

// 🔹 Styles
import "react-toastify/dist/ReactToastify.css";

// 🔹 Stripe public key (NOT secret key)
const stripePromise = loadStripe(
  "pk_test_51S6C4FLezHIMtunfxM9PwTjOFZFAZq4A2YT8OaFC46yk7A3RGOaLtnx6QHsBcd2RIHrpZh8Kw8vz1d8qRfj2Jopf00xS4GkAaz"
);

function App() {
  return (
    <Elements stripe={stripePromise}>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} />

        <Routes>
          {/* 🔹 Redirect root ("/") to login */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* 🔹 Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* 🔹 User Routes (Protected) */}
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
            <Route path="checkout" element={<BookingCheckout />} />
          </Route>

          {/* 🔹 Admin Routes (Protected) */}
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
            <Route path="feedback" element={<AdminFeedback />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* 🔹 Fallback route (if path doesn't exist) */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </Elements>
  );
}

export default App;
