// src/features/tickets/ticketsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../app/axiosClient";

// GET /api/events/:eventId/tickets
export const fetchTickets = createAsyncThunk(
  "tickets/fetchTickets",
  async (eventId, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get(`/api/events/${eventId}/tickets`);
      const data = res.data;
      if (!data.success) {
        return rejectWithValue(data.message || "Failed to load tickets");
      }
      return { eventId, tickets: data.data || [] };
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to load tickets";
      return rejectWithValue(msg);
    }
  }
);

// POST /api/events/:eventId/tickets
export const createTicket = createAsyncThunk(
  "tickets/createTicket",
  async ({ eventId, payload }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post(
        `/api/events/${eventId}/tickets`,
        payload
      );
      const data = res.data;
      if (!data.success) {
        return rejectWithValue(data.message || "Failed to create ticket");
      }
      return { eventId, ticket: data.data };
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to create ticket";
      return rejectWithValue(msg);
    }
  }
);

// PATCH /api/events/:eventId/tickets/:ticketId
export const updateTicket = createAsyncThunk(
  "tickets/updateTicket",
  async ({ eventId, ticketId, payload }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.patch(
        `/api/events/${eventId}/tickets/${ticketId}`,
        payload
      );
      const data = res.data;
      if (!data.success) {
        return rejectWithValue(data.message || "Failed to update ticket");
      }
      return { eventId, ticket: data.data };
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to update ticket";
      return rejectWithValue(msg);
    }
  }
);

// DELETE /api/events/:eventId/tickets/:ticketId
export const deleteTicket = createAsyncThunk(
  "tickets/deleteTicket",
  async ({ eventId, ticketId }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.delete(
        `/api/events/${eventId}/tickets/${ticketId}`
      );
      const data = res.data;
      if (!data.success) {
        return rejectWithValue(data.message || "Failed to delete ticket");
      }
      return { eventId, ticketId };
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to delete ticket";
      return rejectWithValue(msg);
    }
  }
);

const initialState = {
  items: [], // tickets for current event
  isLoading: false,
  error: null,
};

const ticketsSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {
    resetTicketsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchTickets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.items = action.payload.tickets || [];
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to load tickets";
      })

      // CREATE
      .addCase(createTicket.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.items.push(action.payload.ticket);
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to create ticket";
      })

      // UPDATE
      .addCase(updateTicket.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTicket.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        const updated = action.payload.ticket;
        state.items = state.items.map((t) =>
          t._id === updated._id ? updated : t
        );
      })
      .addCase(updateTicket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to update ticket";
      })

      // DELETE
      .addCase(deleteTicket.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTicket.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        const { ticketId } = action.payload;
        state.items = state.items.filter((t) => t._id !== ticketId);
      })
      .addCase(deleteTicket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to delete ticket";
      });
  },
});

export const { resetTicketsState } = ticketsSlice.actions;
export default ticketsSlice.reducer;
