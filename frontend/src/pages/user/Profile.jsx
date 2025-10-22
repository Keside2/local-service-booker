import React, { useEffect, useState } from "react";
import API from "../../pages/axiosInstance";
import { toast } from "react-toastify";
import "../../styles/Profile.css";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");

//   State Hooks 
    const [bookings, setBookings] = useState([]);
    const [activities, setActivities] = useState([]);
  
    const [recentActivity, setRecentActivity] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [loadingActivity, setLoadingActivity] = useState(false);

  // Profile info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [previewPic, setPreviewPic] = useState("");

  // Password info
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState("");

  // UI states
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);

 
  


//   Fetch Bookings 
const fetchBookings = async () => {
    try {
        setLoadingBookings(true);
        const { data } = await API.get("/user/bookings", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        setBookings(data);
    } catch (error) {
        console.error("Error fetching bookings:", error);
    } finally {
        setLoadingBookings(false);
    }
};

// Fetch Recent Activity
const fetchRecentActivity = async () => {
    try {
        setLoadingActivity(true);
        const { data } = await API.get("/user/activity", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        setRecentActivity(data);
    } catch (error) {
        console.error("Error fetching activity:", error);
    } finally {
        setLoadingActivity(false);
    }
};

// Fetch Bookings when tab is active
useEffect(() => {
    if (activeTab === "bookings") {
        fetchBookings();
    }else(activeTab === "recentActivity") 
        fetchRecentActivity();

}, [activeTab]);




  // Load profile info
  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/user/profile");
      setName(data?.name || "");
      setEmail(data?.email || "");
      setProfilePic(data?.profilePic || "");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // Load activity
  const loadActivity = async () => {
    try {
      const { data } = await API.get("/user/activity");
      setActivities(data.activities || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load activity");
    }
  };

  // Load bookings
  const loadBookings = async () => {
    try {
      const { data } = await API.get("/user/bookings");
      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load bookings");
    }
  };

  useEffect(() => {
    loadProfile();
    loadActivity();
    loadBookings();
  }, []);

  // Email validation
  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  // Check password strength
  const checkPasswordStrength = (password) => {
    if (!password) return "";
    const strongRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const mediumRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/;

    if (strongRegex.test(password)) return "strong";
    if (mediumRegex.test(password)) return "medium";
    return "weak";
  };

  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(newPassword));
  }, [newPassword]);

  // Update profile info
  const submitProfile = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      toast.warn("Please fill in name and email");
      return;
    }
    if (!isValidEmail(email)) {
      toast.warn("Please enter a valid email address");
      return;
    }

    setSavingProfile(true);
    try {
      const { data } = await API.put("/user/profile", { name, email });
      setName(data.user.name);
      setEmail(data.user.email);
      toast.success("Profile updated");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // Change password
  const submitPassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.warn("Please fill in all password fields");
      return;
    }
    if (newPassword.length < 6) {
      toast.warn("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.warn("New passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      await API.put("/user/change-password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordStrength("");
      toast.success("Password updated");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const cancelBooking = async (id) => {
  if (!window.confirm("Are you sure you want to cancel this booking?")) return;
  try {
    await API.delete(`/user/bookings/${id}`);
    toast.success("Booking cancelled");
    loadBookings(); // refresh the list
    loadActivity(); // refresh recent activity
  } catch (err) {
    console.error(err);
    toast.error("Failed to cancel booking");
  }
};


  // Upload profile picture
const handleProfilePicUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setUploadingPic(true);

  const formData = new FormData();
  formData.append("profilePic", file);

  try {
    const { data } = await API.put("/user/profile-picture", formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "multipart/form-data",
      },
    });

    const newPicUrl = `http://localhost:5000${data.profilePic}`;

    // ✅ Update state for immediate preview
    setProfilePic(newPicUrl);
    setPreviewPic(newPicUrl);

    // ✅ Update localStorage.user instantly
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const updatedUser = { ...storedUser, profilePic: data.profilePic }; // store raw path (not full URL)
    localStorage.setItem("user", JSON.stringify(updatedUser));

    // ✅ Trigger UserLayout to update instantly
    window.dispatchEvent(new Event("storage"));

    toast.success("Profile picture updated successfully");
  } catch (error) {
    console.error("Upload error:", error);
    toast.error(error.response?.data?.message || "Failed to upload profile picture");
  } finally {
    setUploadingPic(false);
  }
};



  if (loading) {
    return (
      <div className="profile-wrap">
        <div className="card skeleton" />
        <div className="card skeleton" />
      </div>
    );
  }

  return (
    <div className="profile-wrap">
      <h1 className="profile-title">My Profile</h1>

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
        {["personal", "security", "activity", "bookings"].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "personal"
              ? "Personal Info"
              : tab === "security"
              ? "Security"
              : tab === "activity"
              ? "Recent Activity"
              : "Bookings"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {/* Personal Info */}
        {activeTab === "personal" && (
          <form className="card form-card" onSubmit={submitProfile}>
            <h2>Profile Information</h2>
            <div className="form-row">
              <label>Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button className="btn primary" type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}

        {/* Security */}
        {activeTab === "security" && (
          <form className="card form-card" onSubmit={submitPassword}>
            <h2>Change Password</h2>

            <div className="form-row password-row">
              <label>Current Password</label>
              <div className="password-input">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="form-row password-row">
              <label>New Password</label>
              <div className="password-input">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
              {passwordStrength && (
                <p className={`password-strength ${passwordStrength}`}>
                  {passwordStrength === "strong"
                    ? "Strong password"
                    : passwordStrength === "medium"
                    ? "Medium password"
                    : "Weak password"}
                </p>
              )}
            </div>

            <div className="form-row password-row">
              <label>Confirm New Password</label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button className="btn" type="submit" disabled={changingPassword}>
              {changingPassword ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        {/* Recent Activity */}
{activeTab === "activity" && (
  <div className="card">
    <h2>Recent Activity</h2>
    {loadingActivity ? (
      <p>Loading activity...</p>
    ) : recentActivity.length > 0 ? (
      <ul className="activity-list">
        {recentActivity.map((a, index) => (
          <li key={index}>
            <span>{a.message}</span>
            <small>{new Date(a.createdAt).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    ) : (
      <p>No recent activity.</p>
    )}
  </div>
)}

{/* Bookings */}
{activeTab === "bookings" && (
  <div className="card">
    <h2>Your Bookings</h2>
    {bookings.length > 0 ? (
      <table className="bookings-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
  <tr key={b._id}>
    <td>
      <span className="booking-icon">📌</span>
      {b.service?.name || "Unknown Service"}
      
    </td>
    <td>
      <span className="booking-icon">📅</span>
      {new Date(b.date).toLocaleDateString()}
    </td>
    <td>
      <span className="booking-icon">
        {b.status === "completed" ? "✅" : b.status === "cancelled" ? "❌" : "⏳"}
      </span>
      {b.status}
    </td>
    <td>
      {b.status === "pending" && (
        <button
          className="btn danger"
          onClick={() => cancelBooking(b._id)}
        >
          Cancel
        </button>
      )}
    </td>
  </tr>
))}

        </tbody>
      </table>
    ) : (
      <p>No bookings found.</p>
    )}
  </div>
)}


      </div>
    </div>
  );
}
