import axios from "axios";

const API = axios.create({
    baseURL:
        import.meta.env.MODE === "development"
            ? "http://localhost:5000"
            : "https://local-service-booker-api.onrender.com",
});

export default API;
