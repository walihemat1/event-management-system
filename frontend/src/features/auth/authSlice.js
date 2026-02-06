// src/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../app/axiosClient";

const initialState = {
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  isLoading: false,
  hasCheckedAuth: false,
  error: null,
};

const normalizeUser = (u) => {
  if (!u) return null;
  return {
    ...u,
    id: u.id || u._id,
  };
};

/* ===================== SESSION BOOTSTRAP ===================== */
export const bootstrapAuth = createAsyncThunk(
  "auth/bootstrapAuth",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get("/api/auth/me");
      const data = res.data;

      if (!data?.success) {
        return rejectWithValue(data?.message || "Not authenticated");
      }

      return normalizeUser(data.data);
    } catch (err) {
      // If we get 401 here, it simply means "not logged in" (cookie missing/expired)
      if (err.response?.status === 401) {
        return rejectWithValue("UNAUTHENTICATED");
      }

      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to check session";
      return rejectWithValue(msg);
    }
  }
);

/* ===================== REGISTER ===================== */
export const register = createAsyncThunk(
  "auth/register",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post("/api/auth/register", {
        email,
        password,
      });

      const data = res.data;

      if (!data.success) {
        return rejectWithValue(data.message || "Registration failed");
      }

      // Derive username from email
      const derivedUsername = email.split("@")[0];

      return {
        id: data.data.id,
        email: data.data.email,
        username: derivedUsername,
      };
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Registration failed";
      return rejectWithValue(msg);
    }
  }
);

/* ===================== LOGIN ===================== */
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post("/api/auth/login", {
        email,
        password,
      });

      const data = res.data;

      if (!data.success) {
        return rejectWithValue(data.message || "Login failed");
      }

      // Derive username if backend doesn't send one
      const derivedUsername =
        data.data.username && data.data.username !== ""
          ? data.data.username
          : data.data.email.split("@")[0];

      const user = {
        id: data.data.id,
        email: data.data.email,
        fullName: data.data.fullName,
        username: derivedUsername,
        role: data.data.role,
      };

      const token = data.token;

      // Cookie is the primary auth mechanism. We keep token in memory only.
      return {
        user,
        token,
        role: user.role || null,
      };
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Login failed";
      return rejectWithValue(msg);
    }
  }
);

/* ===================== LOGOUT ===================== */
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post("/api/auth/logout");

      const data = res.data;

      if (!data.success) {
        return rejectWithValue(data.message || "Logout failed");
      }

      return true;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Logout failed";
      return rejectWithValue(msg);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuthState: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.hasCheckedAuth = true;
      state.error = null;
    },

    updateAuthUser: (state, action) => {
      const updated = action.payload || {};
      if (!state.user) state.user = {};
      state.user = { ...state.user, ...updated };

      if (updated.role) state.role = updated.role;
    },
  },

  extraReducers: (builder) => {
    builder
      /* -------- BOOTSTRAP -------- */
      .addCase(bootstrapAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.hasCheckedAuth = true;
        state.user = action.payload;
        state.role = action.payload?.role || null;
        state.isAuthenticated = true;
      })
      .addCase(bootstrapAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.hasCheckedAuth = true;
        // Treat missing/expired cookie as logged out (no scary error)
        state.error =
          action.payload === "UNAUTHENTICATED"
            ? null
            : action.payload || "Failed to check session";
        state.user = null;
        state.token = null;
        state.role = null;
        state.isAuthenticated = false;
      })

      /* -------- REGISTER -------- */
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Registration failed";
      })

      /* -------- LOGIN -------- */
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.isAuthenticated = true;
        state.hasCheckedAuth = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Login failed";
        state.isAuthenticated = false;
        state.hasCheckedAuth = true;
      })

      /* -------- LOGOUT -------- */
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.role = null;
        state.isAuthenticated = false;
        state.hasCheckedAuth = true;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.hasCheckedAuth = true;
        state.error = action.payload || "Logout failed";
      });
  },
});

export const { resetAuthState, updateAuthUser } = authSlice.actions;
export default authSlice.reducer;
