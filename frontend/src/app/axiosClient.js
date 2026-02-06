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
      // BUT: Don't reset during bootstrap (hasCheckedAuth = false) - let bootstrapAuth handle it
      if (error?.response?.status === 401) {
        try {
          const state = store?.getState();
          const hasCheckedAuth = state?.auth?.hasCheckedAuth;
          const isBootstrapRequest = error?.config?.url?.includes("/api/auth/me");
          
          // Only reset if auth has been checked (not during initial bootstrap)
          // OR if it's not the bootstrap request (other API calls failing)
          if (hasCheckedAuth || !isBootstrapRequest) {
            store?.dispatch(resetAuthState());
          }
        } catch {
          // ignore
        }
      }
      return Promise.reject(error);
    },
  );
}

export default axiosClient;
