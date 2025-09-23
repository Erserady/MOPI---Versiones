import { createSlice } from "@reduxjs/toolkit";
import { initialStateTables } from "../json/InitialStates";

export const tableSlice = createSlice({
  name: "tables",
  initialState: initialStateTables,
  reducers: {},
});
