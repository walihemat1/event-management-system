import axios from "axios";
import { resetAuthState } from "../features/auth/authSlice";

const axiosClient = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true,
});

let interceptorsAttached = false;

export function setupAxiosInterceptors(store) {
  if (interceptorsAttached) return;
  interceptorsAttached = true;

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
    }
  );
}

export default axiosClient;
