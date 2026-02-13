import axios from "axios";

// ✅ Use baseURL from env, fallback to empty string for relative URLs
const baseURL = process.env.NEXT_PUBLIC_URL_AND_PORT || "";

// ✅ Create shared axios instance
const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ✅ Registration service
export const signUpWithCompleteInfo = (data) => {
  return axiosInstance.post("/api/users", data);
};

// ✅ Login service
export const userLogin = (data) => {
  return axiosInstance.post("/api/login", data);
};

// ✅ ✅ Change password for logged-in user
export const updateUserPassword = (userId, data) => {
  return axiosInstance.put(`/api/users/${userId}`, data);
};
