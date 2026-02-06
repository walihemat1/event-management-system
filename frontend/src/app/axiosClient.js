import axios from "axios";
import { resetAuthState } from "../features/auth/authSlice";

const axiosClient = axios.create({
  // baseURL: "http://localhost:5000",
  baseURL: "https://event-management-system-syey.onrender.com",
  withCredentials: true,
});

let interceptorsAttached = false;

export function setupAxiosInterceptors(store) {
  if (interceptorsAttached) return;
  interceptorsAttached = true;

  // Request interceptor: Add Authorization header with token from Redux store
  axiosClient.interceptors.request.use(
    (config) => {
      const state = store?.getState();
      const token = state?.auth?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  // Response interceptor: Handle 401 errors
  axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
      // If session cookie is missing/expired, force app state to logged-out.
      if (error?.response?.status === 401) {
        try {
          store?.dispatch(resetAuthState());
        } catch {
          // ignore
        }
      }
      return Promise.reject(error);
    },
  );
}

export default axiosClient;
