import { configureStore } from "@reduxjs/toolkit";

export const store = configureStore({
  reducer: {
    data: {
      tables: "[]",
      orders: "[]",
      recipes: "[]",
      users: "[]",
    },
  },
});

export default store;
