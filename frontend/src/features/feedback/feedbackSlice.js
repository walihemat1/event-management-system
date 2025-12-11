import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../app/axiosClient";

// Get all feedback for a specific event
export const fetchEventFeedback = createAsyncThunk(
  "feedback/fetchEventFeedback",
  async (eventId, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get(`/api/event/${eventId}/feedback`);
      const data = res.data;

      if (!data.success) {
        return rejectWithValue(data.message || "Failed to load feedback");
      }

      return { eventId, items: data.data || [] };
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to load feedback";
      return rejectWithValue({ eventId, message: msg });
    }
  }
);

// Add feedback for an event
export const addFeedback = createAsyncThunk(
  "feedback/addFeedback",
  async ({ eventId, rating, comment }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post("/api/event/feedback", {
        eventId,
        rating,
        comment,
      });

      const data = res.data;

      if (!data.success) {
        return rejectWithValue(data.message || "Failed to add feedback");
      }

      return { eventId, item: data.data };
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to add feedback";
      return rejectWithValue(msg);
    }
  }
);

// Update existing feedback
export const updateFeedback = createAsyncThunk(
  "feedback/updateFeedback",
  async ({ feedbackId, eventId, rating, comment }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.patch(`/api/event/feedback/${feedbackId}`, {
        rating,
        comment,
      });

      const data = res.data;

      if (!data.success) {
        return rejectWithValue(data.message || "Failed to update feedback");
      }

      return { eventId, item: data.data };
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to update feedback";
      return rejectWithValue(msg);
    }
  }
);

// Delete feedback
export const deleteFeedback = createAsyncThunk(
  "feedback/deleteFeedback",
  async ({ feedbackId, eventId }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.delete(`/api/event/feedback/${feedbackId}`);

      const data = res.data;

      if (!data.success) {
        return rejectWithValue(data.message || "Failed to delete feedback");
      }

      return { eventId, feedbackId };
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to delete feedback";
      return rejectWithValue(msg);
    }
  }
);

// ---------- SLICE ----------

/**
 * State shape:
 * {
 *   byEvent: {
 *     [eventId]: {
 *       items: Feedback[],
 *       loading: boolean,
 *       error: string | null,
 *     }
 *   },
 *   actionLoading: boolean, // add/edit/delete in progress
 * }
 */

const initialState = {
  byEvent: {},
  actionLoading: false,
};

const feedbackSlice = createSlice({
  name: "feedback",
  initialState,
  reducers: {
    // if you ever want manual clear
    clearEventFeedback: (state, action) => {
      const eventId = action.payload;
      delete state.byEvent[eventId];
    },
  },
  extraReducers: (builder) => {
    builder
      // ---------- FETCH EVENT FEEDBACK ----------
      .addCase(fetchEventFeedback.pending, (state, action) => {
        const eventId = action.meta.arg;
        if (!state.byEvent[eventId]) {
          state.byEvent[eventId] = {
            items: [],
            loading: true,
            error: null,
          };
        } else {
          state.byEvent[eventId].loading = true;
          state.byEvent[eventId].error = null;
        }
      })
      .addCase(fetchEventFeedback.fulfilled, (state, action) => {
        const { eventId, items } = action.payload;
        state.byEvent[eventId] = {
          items,
          loading: false,
          error: null,
        };
      })
      .addCase(fetchEventFeedback.rejected, (state, action) => {
        const eventId = action.payload?.eventId || action.meta.arg;
        const message =
          action.payload?.message || "Failed to load feedback for this event";

        if (!state.byEvent[eventId]) {
          state.byEvent[eventId] = {
            items: [],
            loading: false,
            error: message,
          };
        } else {
          state.byEvent[eventId].loading = false;
          state.byEvent[eventId].error = message;
        }
      })

      // ---------- ADD FEEDBACK ----------
      .addCase(addFeedback.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(addFeedback.fulfilled, (state, action) => {
        state.actionLoading = false;
        const { eventId, item } = action.payload;

        if (!state.byEvent[eventId]) {
          state.byEvent[eventId] = {
            items: [item],
            loading: false,
            error: null,
          };
        } else {
          // if user already has one feedback, caller should have used update,
          // but just in case we push it.
          state.byEvent[eventId].items.push(item);
        }
      })
      .addCase(addFeedback.rejected, (state) => {
        state.actionLoading = false;
      })

      // ---------- UPDATE FEEDBACK ----------
      .addCase(updateFeedback.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateFeedback.fulfilled, (state, action) => {
        state.actionLoading = false;
        const { eventId, item } = action.payload;

        const existing = state.byEvent[eventId];
        if (!existing) return;

        const idx = existing.items.findIndex((f) => f._id === item._id);
        if (idx !== -1) {
          existing.items[idx] = item;
        }
      })
      .addCase(updateFeedback.rejected, (state) => {
        state.actionLoading = false;
      })

      // ---------- DELETE FEEDBACK ----------
      .addCase(deleteFeedback.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteFeedback.fulfilled, (state, action) => {
        state.actionLoading = false;
        const { eventId, feedbackId } = action.payload;

        const existing = state.byEvent[eventId];
        if (!existing) return;

        existing.items = existing.items.filter((f) => f._id !== feedbackId);
      })
      .addCase(deleteFeedback.rejected, (state) => {
        state.actionLoading = false;
      });
  },
});

export const { clearEventFeedback } = feedbackSlice.actions;
export default feedbackSlice.reducer;
