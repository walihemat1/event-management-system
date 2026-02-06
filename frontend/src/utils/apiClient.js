const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://event-management-system-syey.onrender.com";

export async function apiClient(url, options = {}, getState) {
  const token = getState()?.auth?.token;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/api${url}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Request failed");
  }

  return res.json();
}
