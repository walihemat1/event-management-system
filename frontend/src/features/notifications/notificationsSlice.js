// src/features/notifications/notificationsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../app/axiosClient";

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (_, { rejectWithValue }) => {
    try {
      // ✅ no userId in URL; backend uses req.user._id
      const res = await axiosClient.get("/api/notifications/me");
      return res.data.data || [];
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to load notifications"
      );
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      const res = await axiosClient.patch(
        `/api/notifications/${notificationId}`,
        {}
      );
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to mark as read"
      );
    }
  }
);

export const deleteNotification = createAsyncThunk(
  "notifications/delete",
  async (notificationId, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`/api/notifications/${notificationId}`);
      return notificationId;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete notification"
      );
    }
  }
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    addNotification: (state, action) => {
      // prepend new one
      state.items = [action.payload, ...state.items];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload || [];
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to load notifications";
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const updated = action.payload;
        state.items = state.items.map((n) =>
          n._id === updated._id ? updated : n
        );
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const id = action.payload;
        state.items = state.items.filter((n) => n._id !== id);
      });
  },
});

export const { addNotification } = notificationsSlice.actions;

export const selectNotifications = (state) => state.notifications.items;
export const selectNotificationsLoading = (state) =>
  state.notifications.isLoading;
export const selectUnreadCount = (state) =>
  state.notifications.items.filter((n) => !n.isRead).length;

export default notificationsSlice.reducer;
