import axios from "axios";
import NProgress from "nprogress";

// Configure NProgress
NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.2 });

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

api.interceptors.request.use((config) => {
  NProgress.start();
  const token = localStorage.getItem("hope_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  NProgress.done();
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  NProgress.done();
  return response;
}, (error) => {
  NProgress.done();
  return Promise.reject(error);
});

export function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || "Something went wrong";
}

export default api;
