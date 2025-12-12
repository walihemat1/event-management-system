// src/features/admin/adminSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../app/axiosClient";

const initialState = {
  stats: null,
  registrationsOverTime: [],
  ticketSummary: null,
  topEvents: [],
  topTickets: [],
  categoryBreakdown: [],
  pendingEvents: [],
  recentActivity: [],
  isLoading: false,
  error: null,
};

export const fetchAdminDashboard = createAsyncThunk(
  "admin/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get("/api/admin/dashboard");
      const data = res.data;

      if (!data.success) {
        return rejectWithValue(data.message || "Failed to load dashboard");
      }

      return data.data;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to load dashboard";
      return rejectWithValue(msg);
    }
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.stats = action.payload.stats;
        state.registrationsOverTime = action.payload.registrationsOverTime;
        state.ticketSummary = action.payload.ticketSummary;
        state.topEvents = action.payload.topEvents;
        state.topTickets = action.payload.topTickets;
        state.categoryBreakdown = action.payload.categoryBreakdown;
        state.pendingEvents = action.payload.pendingEvents;
        state.recentActivity = action.payload.recentActivity;
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to load admin dashboard";
      });
  },
});

export default adminSlice.reducer;
