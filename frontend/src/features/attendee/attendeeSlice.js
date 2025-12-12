// src/features/attendee/attendeeDashboardSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../app/axiosClient";

const initialState = {
  stats: null,
  upcomingRegistrations: [],
  pastRegistrations: [],
  myRegistrationsOverTime: [],
  myTopEvents: [],
  recentActivity: [],
  isLoading: false,
  error: null,
};

export const fetchAttendeeDashboard = createAsyncThunk(
  "attendeeDashboard/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get("/api/attendee/dashboard");
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

const attendeeDashboardSlice = createSlice({
  name: "attendeeDashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendeeDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAttendeeDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.stats = action.payload.stats;
        state.upcomingRegistrations = action.payload.upcomingRegistrations;
        state.pastRegistrations = action.payload.pastRegistrations;
        state.myRegistrationsOverTime = action.payload.myRegistrationsOverTime;
        state.myTopEvents = action.payload.myTopEvents;
        state.recentActivity = action.payload.recentActivity;
      })
      .addCase(fetchAttendeeDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to load dashboard";
      });
  },
});

export default attendeeDashboardSlice.reducer;
