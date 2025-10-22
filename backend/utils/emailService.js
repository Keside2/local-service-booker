// backend/utils/emailService.js
import nodemailer from "nodemailer";

// 💌 Setup mail transporter (works for Mailtrap or Gmail)
export const createTransporter = () => {
  if (process.env.MAIL_PROVIDER === "mailtrap") {
    return nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST || "sandbox.smtp.mailtrap.io",
      port: process.env.MAILTRAP_PORT || 2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });
  }

  // Gmail setup for real email sending
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });
};

// 🧠 Business info
const COMPANY_NAME = "Local Service Booker";
const COMPANY_LOGO = "https://i.ibb.co/N2xjvJr/logo.png";
const SUPPORT_EMAIL = "support@localservicebooker.com";

// 🧾 Generic branded email wrapper
export const buildBrandedEmail = (subject, content, headerColor = "#007bff") => {
  return `
    <div style="font-family:'Segoe UI',sans-serif;background:#f7f9fc;padding:30px;">
      <div style="max-width:600px;margin:auto;background:white;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
        
        <div style="background:${headerColor};color:white;text-align:center;padding:15px 20px;">
          <img src="${COMPANY_LOGO}" alt="Logo" style="height:50px;margin-bottom:5px;" />
          <h2 style="margin:0;">${subject}</h2>
        </div>

        <div style="padding:25px;color:#333;font-size:15px;line-height:1.6;">
          ${content}
        </div>

        <div style="text-align:center;background:#f9f9f9;padding:20px;">
          <a href="mailto:${SUPPORT_EMAIL}"
             style="background:${headerColor};color:white;padding:10px 20px;border-radius:5px;text-decoration:none;font-weight:bold;">
            Contact Support
          </a>
          <p style="font-size:12px;color:#888;margin-top:10px;">© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
};

// 📤 Send an email with branding
export const sendBrandedEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from:
        process.env.MAIL_PROVIDER === "mailtrap"
          ? "no-reply@localbooker.test"
          : process.env.GMAIL_USER,
      to,
      subject,
      html,
    });

    console.log(`📨 Branded email sent to ${to}`);
  } catch (err) {
    console.error("❌ Email send error:", err);
  }
};
