// src/features/event/eventsSlice.js
import axiosClient from "@/app/axiosClient";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// ----------------------
// Async thunks
// ----------------------

// Create Event
export const createEvent = createAsyncThunk(
  "events/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post("/api/events", payload);
      return res.data;
    } catch (err) {
      if (err.response && err.response.data)
        return rejectWithValue(err.response.data);
      return rejectWithValue({ message: err.message });
    }
  },
);

// Get All Events
export const getEvents = createAsyncThunk(
  "events/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get("/api/events");
      return res.data;
    } catch (err) {
      if (err.response && err.response.data)
        return rejectWithValue(err.response.data);
      return rejectWithValue({ message: err.message });
    }
  },
);

// Get Single Event
export const getEvent = createAsyncThunk(
  "events/getSingle",
  async (eventId, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get(`/api/events/${eventId}`);
      return res.data;
    } catch (err) {
      if (err.response && err.response.data)
        return rejectWithValue(err.response.data);
      return rejectWithValue({ message: err.message });
    }
  },
);

// Get Events for current logged-in user
export const getMyEvents = createAsyncThunk(
  "events/getMine",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get("/api/events/my-events");
      return res.data; // { success, message, data: [...] }
    } catch (err) {
      if (err.response && err.response.data)
        return rejectWithValue(err.response.data);
      return rejectWithValue({ message: err.message });
    }
  },
);

// Update Event
export const updateEvent = createAsyncThunk(
  "events/update",
  async ({ eventId, payload }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.patch(`/api/events/${eventId}`, payload);
      return res.data;
    } catch (err) {
      if (err.response && err.response.data)
        return rejectWithValue(err.response.data);
      return rejectWithValue({ message: err.message });
    }
  },
);

// Delete Event
export const deleteEvent = createAsyncThunk(
  "events/delete",
  async (eventId, { rejectWithValue }) => {
    try {
      const res = await axiosClient.delete(`/api/events/${eventId}`);
      return { eventId, ...res.data };
    } catch (err) {
      if (err.response && err.response.data)
        return rejectWithValue(err.response.data);
      return rejectWithValue({ message: err.message });
    }
  },
);

// Publish Event
export const publishEvent = createAsyncThunk(
  "events/publish",
  async (eventId, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post(`/api/events/${eventId}/publish`, {});
      return res.data;
    } catch (err) {
      if (err.response && err.response.data)
        return rejectWithValue(err.response.data);
      return rejectWithValue({ message: err.message });
    }
  },
);

const initialState = {
  list: [],
  myList: [],
  current: null,
  isLoading: false,
  error: null,
};

const eventsSlice = createSlice({
  name: "events",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Create
      .addCase(createEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list.push(action.payload.data);
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to create event";
      })

      // Get All
      .addCase(getEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload.data;
      })
      .addCase(getEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to fetch events";
      })

      // Get Single
      .addCase(getEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.current = action.payload.data;
      })
      .addCase(getEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to fetch event";
      })

      // Get My Events
      .addCase(getMyEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMyEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myList = action.payload.data; // only current user's events
      })
      .addCase(getMyEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to fetch your events";
      })

      // Update
      .addCase(updateEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = state.list.map((e) =>
          e._id === action.payload.data._id ? action.payload.data : e,
        );
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to update event";
      })

      // Delete
      .addCase(deleteEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        const deletedId = action.payload.eventId;

        // Remove from all-events list
        state.list = state.list.filter((e) => e._id !== deletedId);

        //  Also remove from my-events list
        state.myList = state.myList.filter((e) => e._id !== deletedId);
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to delete event";
      })

      // Publish
      .addCase(publishEvent.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(publishEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myList = state.myList.map((e) =>
          e._id === action.payload.data._id ? action.payload.data : e,
        );
      })
      .addCase(publishEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to publish event";
      });
  },
});

export default eventsSlice.reducer;
