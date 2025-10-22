import { Navigate } from "react-router-dom";

export default function UserRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Only allow normal users
  if (user.role !== "user") {
     return <Navigate to="/admin/dashboard" />;
  }

  return children;
}
