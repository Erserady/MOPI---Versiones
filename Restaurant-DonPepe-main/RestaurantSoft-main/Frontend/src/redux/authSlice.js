import { createSlice } from "@reduxjs/toolkit";

const loadInitialState = () => {
  try {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    return {
      token,
      user: user ? JSON.parse(user) : null,
      status: token ? "authenticated" : "unauthenticated",
    };
  } catch {
    return {
      token: null,
      user: null,
      status: "unauthenticated",
    };
  }
};

const initialState = loadInitialState();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.token = action.payload?.token || null;
      state.user = action.payload?.user || null;
      state.status = state.token ? "authenticated" : "unauthenticated";
    },
    clearCredentials: (state) => {
      state.token = null;
      state.user = null;
      state.status = "unauthenticated";
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
