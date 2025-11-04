import { createSlice } from "@reduxjs/toolkit";
import { initialStateOrders } from "../json/InitialStates";

export const orderSlice = createSlice({
  name: "orders",
  initialState: initialStateOrders,
  reducers: {},
});
