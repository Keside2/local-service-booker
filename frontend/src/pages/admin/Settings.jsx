import React, { useEffect, useState } from "react";
import axiosInstance from "../../pages/axiosInstance";
import { toast } from "react-toastify";
import "./Settings.css";
import { useCurrency } from "../../context/CurrencyContext";


const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Forms
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "" });
  const [businessForm, setBusinessForm] = useState({ name: "", contactEmail: "", phone: "" });
  const [prefForm, setPrefForm] = useState({
    notifications: { email: true, sms: false, push: false },
    currency: "USD",
    timezone: "UTC",
  });
  const [bookingForm, setBookingForm] = useState({ slotDuration: 30, workingHours: "9AM - 5PM" });
  const [paymentForm, setPaymentForm] = useState({ stripeKey: "", currency: "USD" });
  const { changeCurrency } = useCurrency();
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });

  // Profile picture
  const [profilePic, setProfilePic] = useState("");
  const [previewPic, setPreviewPic] = useState("");
  const [uploadingPic, setUploadingPic] = useState(false);

  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const { data } = await axiosInstance.get("/admin/settings/info", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (data?.admin) {
          const a = data.admin;
          setProfileForm({ name: a.name || "", email: a.email || "", phone: a.phone || "" });
          setBusinessForm({
            name: a.businessName || "",
            contactEmail: a.contactEmail || "",
            phone: a.businessPhone || "",
          });
          setPrefForm({
            notifications: {
              email: a.notifications?.email ?? true,
              sms: a.notifications?.sms ?? false,
              push: a.notifications?.push ?? false,
            },
            currency: a.currency || "USD",
            timezone: a.timezone || "UTC",
          });
          setBookingForm({
    slotDuration: a.bookingSettings?.slotDuration || 30,
    workingHours: a.bookingSettings?.workingHours || "9AM - 5PM",
  });

  setPaymentForm({
    stripeKey: a.paymentSettings?.stripeKey || "",
    currency: a.paymentSettings?.currency || "USD",
  });

          setProfilePic(a.logo || "");
          setPreviewPic(a.logo ? `http://localhost:5000${a.logo}` : "");
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load settings");
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // Handlers
// const handleProfilePicUpload = async (e) => {
//   const file = e.target.files[0];
//   if (!file) return;

//   const formData = new FormData();
//   formData.append("profilePic", file); // make sure this matches backend uploadMiddleware.js

//   try {
//     setUploadingPic(true);
//     const { data } = await axiosInstance.put("/admin/settings/profile-picture", formData, {
//       headers: {
//         Authorization: `Bearer ${localStorage.getItem("token")}`,
//         "Content-Type": "multipart/form-data",
//       },
//     });

//     // ✅ Update preview
//     setProfilePic(data.profilePic);
//     setPreviewPic(`http://localhost:5000${data.profilePic}`);

//     // ✅ Update localStorage user object
//     const storedUser = JSON.parse(localStorage.getItem("user"));
//     const updatedUser = { ...storedUser, logo: data.profilePic };
//     localStorage.setItem("user", JSON.stringify(updatedUser));

//     toast.success("Profile picture updated");
//   } catch (error) {
//     toast.error(error.response?.data?.message || "Failed to upload picture");
//   } finally {
//     setUploadingPic(false);
//   }
// };

// Upload profile picture
  const handleProfilePicUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("profilePic", file);

  try {
    setUploadingPic(true);
    const { data } = await axiosInstance.put("/admin/settings/profile-picture", formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "multipart/form-data"
      },
    });

    if (data?.admin) {
      // ✅ Sync state + preview
      setProfilePic(data.admin.logo);
      setPreviewPic(`http://localhost:5000${data.admin.logo}`);

      // ✅ Update localStorage (so sidebar sees it)
      localStorage.setItem("user", JSON.stringify(data.admin));

      toast.success("Profile picture updated successfully");
    }
  } catch (error) {
    console.error("Upload error:", error);
    toast.error(error.response?.data?.message || "Failed to upload profile picture");
  } finally {
    setUploadingPic(false);
  }
};



  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axiosInstance.put("/admin/settings/profile", profileForm);
      if (data?.admin) {
      localStorage.setItem("user", JSON.stringify(data.admin)); // ✅ keep sidebar synced
    }
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleBusinessUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axiosInstance.put("/admin/settings/business", {
        businessName: businessForm.name,
        contactEmail: businessForm.contactEmail,
        phone: businessForm.phone,
      });
      if (data?.admin) {
      localStorage.setItem("user", JSON.stringify(data.admin)); // ✅ keep sidebar synced
    }
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update business info");
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axiosInstance.put("/admin/settings/password", passwordForm);
      if (data?.admin) {
      localStorage.setItem("user", JSON.stringify(data.admin)); // ✅ keep sidebar synced
    }
      toast.success(data.message);
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    }
  };

  const handlePreferencesUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axiosInstance.put("/admin/settings/preferences", prefForm);
      if (data?.admin) {
      localStorage.setItem("user", JSON.stringify(data.admin)); // ✅ keep sidebar synced
    }
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update preferences");
    }
  };

  const handleBookingUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axiosInstance.put("/admin/settings/booking", bookingForm);
      if (data?.admin) {
      localStorage.setItem("user", JSON.stringify(data.admin)); // ✅ keep sidebar synced
    }
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update booking settings");
    }
  };

  const handlePaymentUpdate = async (e) => {
  e.preventDefault();
  try {
    const { data } = await axiosInstance.put("/admin/settings/payments", paymentForm);
    if (data?.admin) {
      localStorage.setItem("user", JSON.stringify(data.admin));

      // ✅ Update global currency context
      changeCurrency(paymentForm.currency);
    }
    toast.success(data.message);
    setTimeout(() => {
  window.location.reload();
}, 800);
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to update payment settings");
  } 
};


  return (
    <div className="settings-container">
      <h1 className="settings-header">Admin Settings</h1>

      {/* Profile Picture */}
      <div className="profile-pic-section">
        <img
             src={previewPic || (profilePic ? `http://localhost:5000${profilePic}` : "/default-avatar.png")}
            alt="Profile"
            className="profile-pic"
        />
        <label className="upload-btn">
          {uploadingPic ? "Uploading..." : "Change Picture"}
          <input type="file" accept="image/*" onChange={handleProfilePicUpload} hidden />
        </label>
      </div>


      {/* Tabs */}
      <div className="profile-tabs">
        {["profile", "business", "password", "payments"].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "profile"
              ? "Profile"
              : tab === "business"
              ? "Business Info"
              : tab === "password"
              ? "Password"
              : tab === "preferences"
              ? "Preferences"
              : tab === "booking"
              ? "Booking"
              : "Payments"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {loadingProfile ? (
          <p>Loading settings...</p>
        ) : (
          <>
            {/* Profile */}
            {activeTab === "profile" && (
              <form className="card form-card" onSubmit={handleProfileUpdate}>
                <h2>Profile</h2>
                <div className="form-row">
                  <label>Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <label>Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>
                {/* <div className="form-row">
                  <label>Phone</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </div> */}
                <button className="btn primary" type="submit">Save Profile</button>
              </form>
            )}

            {/* Business */}
            {activeTab === "business" && (
              <form className="card form-card" onSubmit={handleBusinessUpdate}>
                <h2>Business Info</h2>
                <div className="form-row">
                  <label>Business Name</label>
                  <input
                    type="text"
                    value={businessForm.name}
                    onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    value={businessForm.contactEmail}
                    onChange={(e) => setBusinessForm({ ...businessForm, contactEmail: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <label>Business Phone</label>
                  <input
                    type="text"
                    value={businessForm.phone}
                    onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                  />
                </div>
                <button className="btn primary" type="submit">Save Business Info</button>
              </form>
            )}

            {/* Password */}
            {activeTab === "password" && (
              <form className="card form-card" onSubmit={handlePasswordUpdate}>
                <h2>Change Password</h2>
                <div className="form-row">
                  <label>Current Password</label>
                  <div className="password-input">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                    />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                      {showCurrentPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <div className="form-row">
                  <label>New Password</label>
                  <div className="password-input">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}>
                      {showNewPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <button className="btn" type="submit">Update Password</button>
              </form>
            )}

            {/* Preferences */}
            {activeTab === "preferences" && (
              <form className="card form-card" onSubmit={handlePreferencesUpdate}>
                <h2>Preferences</h2>
                <div className="form-row">
                  <label>Email Notifications</label>
                  <input
                    type="checkbox"
                    checked={prefForm.notifications.email}
                    onChange={(e) =>
                      setPrefForm({
                        ...prefForm,
                        notifications: { ...prefForm.notifications, email: e.target.checked },
                      })
                    }
                  />
                </div>
                <div className="form-row">
                  <label>SMS Notifications</label>
                  <input
                    type="checkbox"
                    checked={prefForm.notifications.sms}
                    onChange={(e) =>
                      setPrefForm({
                        ...prefForm,
                        notifications: { ...prefForm.notifications, sms: e.target.checked },
                      })
                    }
                  />
                </div>
                <div className="form-row">
                  <label>Currency</label>
                  <select
                    value={prefForm.currency}
                    onChange={(e) => setPrefForm({ ...prefForm, currency: e.target.value })}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="NGN">NGN</option>
                  </select>
                </div>
                <div className="form-row">
                  <label>Timezone</label>
                  <input
                    type="text"
                    value={prefForm.timezone}
                    onChange={(e) => setPrefForm({ ...prefForm, timezone: e.target.value })}
                  />
                </div>
                <button className="btn primary" type="submit">Save Preferences</button>
              </form>
            )}

            {/* Booking */}
            {activeTab === "booking" && (
              <form className="card form-card" onSubmit={handleBookingUpdate}>
                <h2>Booking Settings</h2>
                <div className="form-row">
                  <label>Slot Duration (minutes)</label>
                  <input
                    type="number"
                    value={bookingForm.slotDuration}
                    onChange={(e) => setBookingForm({ ...bookingForm, slotDuration: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <label>Working Hours</label>
                  <input
                    type="text"
                    value={bookingForm.workingHours}
                    onChange={(e) => setBookingForm({ ...bookingForm, workingHours: e.target.value })}
                  />
                </div>
                <button className="btn primary" type="submit">Save Booking Settings</button>
              </form>
            )}

            {/* Payments */}
            {activeTab === "payments" && (
              <form className="card form-card" onSubmit={handlePaymentUpdate}>
                <h2>Payment Settings</h2>
                <div className="form-row">
                  <label>Stripe Key</label>
                  <input
                    type="text"
                    value={paymentForm.stripeKey}
                    onChange={(e) => setPaymentForm({ ...paymentForm, stripeKey: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <label>Currency</label>
                  <select
                    value={paymentForm.currency}
                    onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value })}
                  >
                    <option value="USD">USD – United States Dollar</option>
    <option value="EUR">EUR – Euro</option>
    <option value="GBP">GBP – British Pound</option>
    <option value="NGN">NGN – Nigerian Naira</option>
    <option value="JPY">JPY – Japanese Yen</option>
    <option value="CNY">CNY – Chinese Yuan</option>
    <option value="INR">INR – Indian Rupee</option>
    <option value="CAD">CAD – Canadian Dollar</option>
    <option value="AUD">AUD – Australian Dollar</option>
    <option value="NZD">NZD – New Zealand Dollar</option>
    <option value="CHF">CHF – Swiss Franc</option>
    <option value="SEK">SEK – Swedish Krona</option>
    <option value="NOK">NOK – Norwegian Krone</option>
    <option value="DKK">DKK – Danish Krone</option>
    <option value="ZAR">ZAR – South African Rand</option>
    <option value="GHS">GHS – Ghanaian Cedi</option>
    <option value="KES">KES – Kenyan Shilling</option>
    <option value="UGX">UGX – Ugandan Shilling</option>
    <option value="TZS">TZS – Tanzanian Shilling</option>
    <option value="EGP">EGP – Egyptian Pound</option>
    <option value="MAD">MAD – Moroccan Dirham</option>
    <option value="AED">AED – UAE Dirham</option>
    <option value="SAR">SAR – Saudi Riyal</option>
    <option value="QAR">QAR – Qatari Riyal</option>
    <option value="BHD">BHD – Bahraini Dinar</option>
    <option value="KWD">KWD – Kuwaiti Dinar</option>
    <option value="PKR">PKR – Pakistani Rupee</option>
    <option value="BDT">BDT – Bangladeshi Taka</option>
    <option value="LKR">LKR – Sri Lankan Rupee</option>
    <option value="MYR">MYR – Malaysian Ringgit</option>
    <option value="SGD">SGD – Singapore Dollar</option>
    <option value="IDR">IDR – Indonesian Rupiah</option>
    <option value="THB">THB – Thai Baht</option>
    <option value="PHP">PHP – Philippine Peso</option>
    <option value="VND">VND – Vietnamese Dong</option>
    <option value="KRW">KRW – South Korean Won</option>
    <option value="HKD">HKD – Hong Kong Dollar</option>
    <option value="BRL">BRL – Brazilian Real</option>
    <option value="ARS">ARS – Argentine Peso</option>
    <option value="CLP">CLP – Chilean Peso</option>
    <option value="MXN">MXN – Mexican Peso</option>
    <option value="COP">COP – Colombian Peso</option>
    <option value="PEN">PEN – Peruvian Sol</option>
    <option value="RUB">RUB – Russian Ruble</option>
    <option value="TRY">TRY – Turkish Lira</option>
    <option value="PLN">PLN – Polish Zloty</option>
    <option value="CZK">CZK – Czech Koruna</option>
    <option value="HUF">HUF – Hungarian Forint</option>
    <option value="ILS">ILS – Israeli Shekel</option>
    <option value="RON">RON – Romanian Leu</option>

                  </select>
                </div>
                <button className="btn primary" type="submit">Save Payment Settings</button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Settings;
