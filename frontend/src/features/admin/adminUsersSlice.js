// src/features/admin/adminUsersSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "@/app/axiosClient";

// GET /api/admin/users?page=&limit=&search=&role=&status=
export const fetchAdminUsers = createAsyncThunk(
  "adminUsers/fetchAdminUsers",
  async (params = {}, { rejectWithValue }) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        role = "",
        status = "",
      } = params;

      const res = await axiosClient.get("/api/admin/users", {
        params: { page, limit, search, role, status },
      });

      if (!res.data?.success) {
        return rejectWithValue(res.data?.message || "Failed to fetch users");
      }

      return res.data;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to fetch users";
      return rejectWithValue(msg);
    }
  }
);

// PATCH /api/admin/users/:userId/status
export const updateUserActivation = createAsyncThunk(
  "adminUsers/updateUserActivation",
  async ({ userId, isActive }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.patch(`/api/admin/users/${userId}/status`, {
        isActive,
      });

      if (!res.data?.success) {
        return rejectWithValue(res.data?.message || "Failed to update status");
      }

      return res.data.data;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to update status";
      return rejectWithValue(msg);
    }
  }
);

// 🆕 PATCH /api/admin/users/:userId/role
export const updateUserRole = createAsyncThunk(
  "adminUsers/updateUserRole",
  async ({ userId, role }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.patch(`/api/admin/users/${userId}/role`, {
        role,
      });

      if (!res.data?.success) {
        return rejectWithValue(res.data?.message || "Failed to update role");
      }

      return res.data.data;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to update role";
      return rejectWithValue(msg);
    }
  }
);

const adminUsersSlice = createSlice({
  name: "adminUsers",
  initialState: {
    list: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
    isLoading: false,
    error: null,
    filters: {
      search: "",
      role: "",
      status: "",
    },
  },
  reducers: {
    setAdminUserFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch users";
      })

      .addCase(updateUserActivation.fulfilled, (state, action) => {
        const updated = action.payload;
        state.list = state.list.map((u) =>
          u._id === updated._id ? { ...u, ...updated } : u
        );
      })

      // 🆕 update role in list
      .addCase(updateUserRole.fulfilled, (state, action) => {
        const updated = action.payload;
        state.list = state.list.map((u) =>
          u._id === updated._id ? { ...u, ...updated } : u
        );
      });
  },
});

export const { setAdminUserFilters } = adminUsersSlice.actions;
export default adminUsersSlice.reducer;
