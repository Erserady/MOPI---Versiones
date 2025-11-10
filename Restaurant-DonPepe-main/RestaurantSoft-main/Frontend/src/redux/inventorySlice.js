import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { inventoryService } from "../services/inventoryService";

export const fetchInventory = createAsyncThunk(
  "inventory/fetch",
  async (_, { rejectWithValue }) => {
    try {
      return await inventoryService.fetchInventory();
    } catch (error) {
      return rejectWithValue(error?.data || { detail: error.message });
    }
  }
);

export const saveInventoryItem = createAsyncThunk(
  "inventory/saveItem",
  async (item, { rejectWithValue }) => {
    try {
      if (item.id) {
        return await inventoryService.updateItem(item.id, item);
      }
      return await inventoryService.createItem(item);
    } catch (error) {
      return rejectWithValue(error?.data || { detail: error.message });
    }
  }
);

export const removeInventoryItem = createAsyncThunk(
  "inventory/removeItem",
  async (id, { rejectWithValue }) => {
    try {
      await inventoryService.deleteItem(id);
      return id;
    } catch (error) {
      return rejectWithValue(error?.data || { detail: error.message });
    }
  }
);

const initialState = {
  items: [],
  status: "idle",
  error: null,
};

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventory.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.payload?.detail || "No se pudo cargar el inventario";
      })
      .addCase(saveInventoryItem.fulfilled, (state, action) => {
        const item = action.payload;
        const index = state.items.findIndex((inv) => inv.id === item.id);
        if (index >= 0) {
          state.items[index] = item;
        } else {
          state.items.push(item);
        }
      })
      .addCase(removeInventoryItem.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export default inventorySlice.reducer;
