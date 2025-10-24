import axios from "axios";

const API = axios.create({
    baseURL:
        import.meta.env.MODE === "development"
            ? "http://localhost:5000/api"
            : "https://local-service-booker-api.onrender.com/api",
});

export default API;
