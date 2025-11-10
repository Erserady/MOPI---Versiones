import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import menuReducer from "./menuSlice";
import dashboardReducer from "./dashboardSlice";
import inventoryReducer from "./inventorySlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    menu: menuReducer,
    dashboard: dashboardReducer,
    inventory: inventoryReducer,
  },
});

export default store;
