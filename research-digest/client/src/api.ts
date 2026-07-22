import axios from "axios";
import toast from "react-hot-toast";

export const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    } else {
      const message = error.response?.data?.detail || error.response?.data?.error || "An unexpected error occurred.";
      toast.error(message);
    }
    return Promise.reject(error);
  }
);
