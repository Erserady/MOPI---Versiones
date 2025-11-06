import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import HandleOrder from "../../modules/waiter_module/components/HandleOrder";
import "../../styles/orders_handler_view.css";
import {
  Trash2,
  ArrowLeftToLine,
  ArrowBigUp,
  ArrowBigDown,
} from "lucide-react";

const OrdersHandlerView = () => {
  const { tableNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNav, setShowNav] = useState(false);

  useEffect(() => {
    !showNav ? setShowNav(location.pathname.includes("orders-handler/")) : "";
  }, [location, showNav]);

  const HandleCustomOrder = (orderNumber) => {
    console.log(orderNumber);
    navigate(`/waiter-dashboard/${tableNumber}/orders-handler/${orderNumber}`);
  };

  return (
    <section className="orders-handler-view">
      <h1 id="content-view">Pedidos para la mesa {tableNumber}</h1>
      <HandleOrder></HandleOrder>
      <button
        className="return-btn"
        onClick={() => navigate("/waiter-dashboard")}
      >
        <ArrowLeftToLine size={19} />
        Volver
      </button>
    </section>
  );
};

export default OrdersHandlerView;
