import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CookDashboard from "../views/cook_dashboard/CookDashboard";
import WaiterDashboard from "../views/waiter_dashboard/WaiterDashboard";
import { Router } from "lucide-react";
import OrdersHandlerView from "../views/waiter_dashboard/OrdersHandlerView";
import Login from "../views/login_view/Login";
import CashierDashboard from "../views/cashier_dashboard/CashierDashboard";
import AdminDashboard from "../views/admin_dashboard/AdminDashboard";
import AdminDashboardPreview from "../views/admin_dashboard/AdminDashboardPreview";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login></Login>} />
        <Route path="/login" element={<Login></Login>}></Route>
        <Route
          path="/cook-dashboard"
          element={<CookDashboard></CookDashboard>}
        />
        <Route path="/waiter-dashboard" element={<WaiterDashboard />}>
          <Route
            path=":tableNumber/orders-handler"
            element={<OrdersHandlerView />}
          ></Route>
        </Route>
        <Route
          path="/cashier-dashboard"
          element={<CashierDashboard></CashierDashboard>}
        ></Route>
        <Route
          path="/admin-dashboard"
          element={<AdminDashboard></AdminDashboard>}
        />
        <Route path="/admin-preview" element={<AdminDashboardPreview />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
