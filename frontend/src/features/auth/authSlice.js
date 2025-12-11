// src/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../app/axiosClient";

const storedAuth = localStorage.getItem("auth");
const initialAuth = storedAuth ? JSON.parse(storedAuth) : null;

const initialState = {
  user: initialAuth?.user || null,
  token: initialAuth?.token || null,
  role: initialAuth?.role || null,
  isAuthenticated: !!initialAuth?.token,
  isLoading: false,
  error: null,
};

const persistAuth = (state) => {
  const authToStore = {
    user: state.user,
    token: state.token,
    role: state.role,
  };
  localStorage.setItem("auth", JSON.stringify(authToStore));
};

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

      const authToStore = {
        user,
        token,
        role: user.role || null,
      };

      localStorage.setItem("auth", JSON.stringify(authToStore));

      return authToStore;
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

      localStorage.removeItem("auth");
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
      state.error = null;
      localStorage.removeItem("auth");
    },

    updateAuthUser: (state, action) => {
      const updated = action.payload || {};
      if (!state.user) state.user = {};
      state.user = { ...state.user, ...updated };

      if (updated.role) state.role = updated.role;

      persistAuth(state);
    },
  },

  extraReducers: (builder) => {
    builder
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
        persistAuth(state);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Login failed";
        state.isAuthenticated = false;
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
        state.error = null;
        localStorage.removeItem("auth");
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Logout failed";
      });
  },
});

export const { resetAuthState, updateAuthUser } = authSlice.actions;
export default authSlice.reducer;
