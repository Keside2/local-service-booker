import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Only allow admin
  if (user.role !== "admin") {
    return <Navigate to="/user" replace />;
  }

  return children;
}
