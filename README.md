# 🏡 Local Service Booker

A **full-stack service booking platform** that allows users to book local services (like hostel, hotel etc.), make secure payments, and receive booking confirmations by email. Admins can manage bookings, update statuses, and oversee service availability.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Backend Overview](#backend-overview)
- [Frontend Overview](#frontend-overview)
- [API Endpoints](#api-endpoints)
- [Email Notifications](#email-notifications)
- [Payment Flow (Stripe)](#payment-flow-stripe)
- [Booking Flow](#booking-flow)
- [Security Features](#security-features)
- [Future Improvements](#future-improvements)
- [License](#license)

---

## 🚀 Overview

**Local Service Booker** is a full-stack MERN application that allows customers to:

- Browse and book local services
- Make online payments securely via **Stripe**
- Receive booking confirmation emails
- Admins can manage users, bookings, and service availability

We built this from scratch using **Node.js**, **Express**, **MongoDB**, **React (Vite)**, and **Nodemailer** for transactional emails.

---

## 🧩 Tech Stack

### 🖥️ Frontend

- **React (Vite)**
- **CSS**
- **Axios**
- **React Router**
- **React Toastify**
- **Stripe.js**

### ⚙️ Backend

- **Node.js**
- **Express.js**
- **MongoDB + Mongoose**
- **JWT Authentication**
- **Stripe API**
- **Nodemailer**
- **dotenv**
- **CORS & Helmet**

---

## 🌟 Features

### 👥 Users

- Register & login securely
- Browse services
- Make bookings with date/time selection
- Pay via Stripe
- Receive confirmation emails
- View booking history

### 🧑‍💼 Admin

- Manage all users & bookings
- Approve, cancel, or complete bookings
- Update status with email notifications
- Manage service availability

### 💳 Payment

- Integrated with **Stripe Checkout**
- Handles payment intents & webhooks
- Sends confirmation emails on success

### 📧 Email Notifications

- Supports **Mailtrap (testing)** and **Gmail (production)**
- HTML-branded templates with company logo
- Booking Approved ✅ / Completed 🎉 / Cancelled ❌

---

## 🧱 Project Structure

```
local-service-booker/
│
├── backend/
│   ├── .env
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## ⚙️ Installation & Setup

```bash
# Clone repo
git clone https://github.com/yourusername/local-service-booker.git
cd local-service-booker

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Run
npm run dev
```

---

## 🔐 Environment Variables

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=supersecretlongrandomstring

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_CURRENCY=usd

MAIL_PROVIDER=mailtrap
GMAIL_USER=your_gmail@example.com
GMAIL_PASS=your_gmail_app_password

MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_mailtrap_user
MAILTRAP_PASS=your_mailtrap_pass

ADMIN_EMAIL=your_admin_email@example.com
```

---

## 🧠 Backend Overview

### Controllers

- `authController.js` – handles login/register
- `bookingController.js` – booking creation, updates, Stripe payments, and emails
- `serviceController.js` – service CRUD
- `userController.js` – user management
- `adminController.js` – admin management
- `adminSettingsController.js` – admin settings management
- `feedbackController.js` – handles feedback for user
- `paymentsController.js` – handles payments

### Utilities

- `emailService.js` – handles branded email sending with headers (Green/Blue/Red)
- `autoUnblockService.js` – hndales services when their time expired(it free up services when the date the user selected Reach)

### Models

- `Activity.js` – handles Activity model
- `Admin.js` – handles Admin Model
- `Booking.js` – handles Booking model
- `Feedback.js` – handles Feedback Model
- `Service.js` – handles Services Model
- `User.js` – handles User Model

---

## 💻 Frontend Overview

### Pages

- `/` → Home
- `/login` → User login
- `/register` → Register
- `/bookings` → Booking list
- `/service/:id` → Single service
- `/checkout` → Stripe checkout
- `/admin` → Admin dashboard

---

## 🔗 API Endpoints

### Auth

```
POST /api/auth/register
POST /api/auth/login
GET /api/auth/profile
```

### Services

```
GET /api/services
POST /api/services
PUT /api/services/:id
DELETE /api/services/:id
```

### Bookings

```
POST /api/bookings/confirm
PUT /api/bookings/:id
GET /api/bookings/my-bookings
```

---

## 💌 Email Notifications

| Status    | Header               | Color    |
| --------- | -------------------- | -------- |
| Approved  | ✅ Booking Approved  | 🟢 Green |
| Completed | 🎉 Booking Completed | 🔵 Blue  |
| Cancelled | ❌ Booking Cancelled | 🔴 Red   |

---

## 💳 Payment Flow (Stripe)

1. User books service → `/create-payment-intent`
2. Stripe checkout opens
3. On success → `/confirmBooking`
4. Booking saved, service updated, email sent

---

## 📅 Booking Flow

1. User selects service + date
2. Payment via Stripe
3. Booking created in DB
4. Email confirmation sent
5. Admin updates booking → email triggered

---

## 🔒 Security

- JWT auth middleware
- Bcrypt password hashing
- CORS & Helmet
- Input validation

---

## 🚧 Future Improvements

- Add image upload via Cloudinary
- Add service reviews
- Add Twilio SMS alerts
- Calendar view for admin

---

## 🪪 License

MIT License © 2025 Local Service Booker
