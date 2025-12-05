import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import CookDashboard from "../views/cook_dashboard/CookDashboard";
import WaiterDashboard from "../views/waiter_dashboard/WaiterDashboard";
import OrdersHandlerView from "../views/waiter_dashboard/OrdersHandlerView";
import Login from "../views/login_view/Login";
import CashierDashboard from "../views/cashier_dashboard/CashierDashboard";
import AdminDashboard from "../views/admin_dashboard/AdminDashboard";
import AdminDashboardPreview from "../views/admin_dashboard/AdminDashboardPreview";
import { getActiveRole, getAuthStage, isAuthenticated } from "../utils/auth";

const ProtectedRoute = ({ children, requireRole = false, allowedRoles = [] }) => {
  const location = useLocation();
  const authed = isAuthenticated();
  const activeRole = getActiveRole();
  const authStage = getAuthStage();

  if (!authed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireRole) {
    if (!activeRole || authStage !== "role-selected") {
      return <Navigate to="/admin-preview" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(activeRole)) {
      return <Navigate to="/admin-preview" replace />;
    }
  }

  return children;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login></Login>} />
        <Route path="/login" element={<Login></Login>}></Route>
        <Route
          path="/cashier-dashboard"
          element={
            <ProtectedRoute requireRole allowedRoles={["cashier"]}>
              <CashierDashboard></CashierDashboard>
            </ProtectedRoute>
          }
        ></Route>
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute requireRole allowedRoles={["admin"]}>
              <AdminDashboard></AdminDashboard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-preview"
          element={
            <ProtectedRoute>
              <AdminDashboardPreview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cook-dashboard"
          element={
            <ProtectedRoute requireRole allowedRoles={["cook"]}>
              <CookDashboard></CookDashboard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/waiter-dashboard"
          element={
            <ProtectedRoute requireRole allowedRoles={["waiter"]}>
              <WaiterDashboard />
            </ProtectedRoute>
          }
        >
          <Route
            path=":tableNumber/orders-handler"
            element={<OrdersHandlerView />}
          ></Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
