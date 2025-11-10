import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { dashboardService } from "../services/dashboardService";

export const fetchAdminDashboard = createAsyncThunk(
  "dashboard/fetchAdmin",
  async (_, { rejectWithValue }) => {
    try {
      return await dashboardService.fetchAdminSummary();
    } catch (error) {
      return rejectWithValue(error?.data || { detail: error.message });
    }
  }
);

const initialState = {
  metrics: null,
  status: "idle",
  error: null,
  lastUpdated: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.metrics = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.payload?.detail ||
          "No se pudo cargar la informaci��n del dashboard";
      });
  },
});

export default dashboardSlice.reducer;
