import React from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import CookDashboard from "../views/cook_dashboard/CookDashboard";
import WaiterDashboard from "../views/waiter_dashboard/WaiterDashboard";
import { Router } from "lucide-react";
import OrdersHandlerView from "../views/waiter_dashboard/OrdersHandlerView";
import CustomOrder from "../views/waiter_dashboard/CustomOrder";
import Login from "../views/login_view/Login";

const ComponentTemporal = () => {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <>
      <h1>----------------</h1>
      <button onClick={() => handleNavigate("/cook-dashboard")}>cocina</button>
      <h1>----------------</h1>
      <button onClick={() => handleNavigate("/waiter-dashboard")}>
        mesero
      </button>
      <h1>----------------</h1>
      <button onClick={() => handleNavigate("/login")}>login</button>
      <h1>----------------</h1>
    </>
  );
};
const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ComponentTemporal></ComponentTemporal>} />
        <Route path="/login" element={<Login></Login>}></Route>
        <Route
          path="/cook-dashboard"
          element={<CookDashboard></CookDashboard>}
        />
        <Route path="/waiter-dashboard" element={<WaiterDashboard />}>
          <Route
            path=":tableNumber/orders-handler"
            element={<OrdersHandlerView />}
          >
            <Route
              path=":orderNumber/"
              element={<CustomOrder></CustomOrder>}
            ></Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
