import axios from "axios";

const axiosInstance = axios.create({
    baseURL:
        import.meta.env.VITE_API_URL ||
        (window.location.hostname === "localhost"
            ? "http://localhost:5000/api"
            : "https://local-service-booker-api.onrender.com/api"),

    headers: {
        "Content-Type": "application/json",
    },
});

// ✅ Add token to every request
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ✅ Handle response errors
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const status = error.response.status;

            if (status === 403 && error.response.data?.reason === "suspended") {
                // ✅ Account is suspended → redirect to login with message
                alert("Your account is suspended.");
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login?error=suspended";
            } else if (status === 401 && error.response.data?.message === "Invalid or expired token") {
                alert("Session expired. Please log in again.");
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login?error=session";
            }

        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
