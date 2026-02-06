// src/redux/category/categorySlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "@/app/axiosClient";

// GET ALL
export const getCategories = createAsyncThunk(
  "category/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get("/api/categories");
      return res.data.data; // array of categories
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  },
);

// CREATE
export const createCategory = createAsyncThunk(
  "category/create",
  async (values, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post("/api/categories", values);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  },
);

// UPDATE
export const updateCategory = createAsyncThunk(
  "category/update",
  async ({ id, values }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.patch(`/api/categories/${id}`, values);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  },
);

// DELETE
export const deleteCategory = createAsyncThunk(
  "category/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`/api/categories${id}`);
      return id; // return deleted ID to update state
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  },
);

const initialState = {
  list: [], // category array
  isLoading: false,
  error: null,
};

const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(getCategories.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload;
      })
      .addCase(getCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.list.unshift(action.payload); // add new category to top
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.list.findIndex(
          (cat) => cat._id === action.payload._id,
        );
        if (index !== -1) state.list[index] = action.payload;
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => c._id !== action.payload);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default categorySlice.reducer;
