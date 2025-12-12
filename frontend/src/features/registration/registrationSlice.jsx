import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../app/axiosClient";

// USER: get my registrations
export const getMyRegistrations = createAsyncThunk(
  "registrations/getMyRegistrations",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get("/api/eventRegistrations/me");
      const data = res.data;
      if (!data.success) {
        return rejectWithValue(data.message || "Failed to load registrations");
      }
      return data.data || [];
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to load registrations";
      return rejectWithValue(msg);
    }
  }
);

// USER: create registration
export const createRegistration = createAsyncThunk(
  "registrations/createRegistration",
  async (
    { eventId, ticketId, quantity, totalAmount, paymentMethod },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosClient.post("/api/eventRegistrations", {
        eventId,
        ticketId,
        quantity,
        totalAmount,
        paymentMethod,
      });

      const data = res.data;
      if (!data.success) {
        return rejectWithValue(data.message || "Registration failed");
      }
      return data.data;
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

// USER: cancel registration
export const cancelRegistration = createAsyncThunk(
  "registrations/cancelRegistration",
  async (registrationId, { rejectWithValue }) => {
    try {
      const res = await axiosClient.patch(
        `/api/eventRegistrations/${registrationId}/cancel`
      );
      const data = res.data;
      if (!data.success) {
        return rejectWithValue(data.message || "Failed to cancel registration");
      }
      return data.data;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to cancel registration";
      return rejectWithValue(msg);
    }
  }
);

// ORGANIZER: get registrations for specific event
export const getEventRegistrations = createAsyncThunk(
  "registrations/getEventRegistrations",
  async (eventId, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get(
        `/api/event/${eventId}/eventRegistrations`
      );
      const data = res.data;
      if (!data.success) {
        return rejectWithValue(
          data.message || "Failed to load event registrations"
        );
      }
      return data.data || [];
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to load event registrations";
      return rejectWithValue(msg);
    }
  }
);

const initialState = {
  // user-side
  items: [], // my registrations
  isLoading: false,
  createLoading: false,
  cancelLoading: false,
  error: null,

  // organizer-side
  eventItems: [], // registrations for current event
  eventLoading: false,
  eventError: null,
};

const registrationSlice = createSlice({
  name: "registrations",
  initialState,
  reducers: {
    resetRegistrationsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // MY REGISTRATIONS
      .addCase(getMyRegistrations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMyRegistrations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(getMyRegistrations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to load registrations";
      })

      // CREATE
      .addCase(createRegistration.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createRegistration.fulfilled, (state, action) => {
        state.createLoading = false;
        // push or update in items (my registrations)
        const reg = action.payload;
        const idx = state.items.findIndex((r) => r._id === reg._id);
        if (idx >= 0) state.items[idx] = reg;
        else state.items.push(reg);
      })
      .addCase(createRegistration.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload || "Registration failed";
      })

      // CANCEL
      .addCase(cancelRegistration.pending, (state) => {
        state.cancelLoading = true;
        state.error = null;
      })
      .addCase(cancelRegistration.fulfilled, (state, action) => {
        state.cancelLoading = false;
        const updated = action.payload;
        const idx = state.items.findIndex((r) => r._id === updated._id);
        if (idx >= 0) state.items[idx] = updated;

        // also update eventItems if present
        const idxEv = state.eventItems.findIndex((r) => r._id === updated._id);
        if (idxEv >= 0) state.eventItems[idxEv] = updated;
      })
      .addCase(cancelRegistration.rejected, (state, action) => {
        state.cancelLoading = false;
        state.error = action.payload || "Failed to cancel registration";
      })

      // ORGANIZER: GET EVENT REGISTRATIONS
      .addCase(getEventRegistrations.pending, (state) => {
        state.eventLoading = true;
        state.eventError = null;
      })
      .addCase(getEventRegistrations.fulfilled, (state, action) => {
        state.eventLoading = false;
        state.eventItems = action.payload;
      })
      .addCase(getEventRegistrations.rejected, (state, action) => {
        state.eventLoading = false;
        state.eventError =
          action.payload || "Failed to load event registrations";
      });
  },
});

export const { resetRegistrationsState } = registrationSlice.actions;
export default registrationSlice.reducer;
