import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Outlet, useLocation } from "react-router-dom";
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
      <p className="explain-text-desktop">
        Selecciona una cuenta en la parte izquierda para agregarle platillos.
      </p>
      <p className="explain-text-mobile">
        Selecciona una cuenta en la parte inferior para agregarle platillos.
      </p>
      <p>Si no existe cuenta, click en agregar cuenta.</p>
      <div className="content shadow">
        <aside className="orders-container">
          <div className="orders-header">
            <h2>Cuentas</h2>
            <button className="action-btn">
              <span>+</span> Agregar Cuenta
            </button>
          </div>
          <div className="card-container">
            {[1, 2, 3].map((index) => (
              <article
                title="Click para ver detalles"
                key={index}
                onClick={() => HandleCustomOrder(index)}
                className="order-card shadow"
              >
                <div>
                  <h3>Cuenta #{index}</h3>
                  <button>
                    <Trash2></Trash2>
                  </button>
                </div>
                <p>Elementos: {"5"}</p>
                <p>Subtotal: C${"100"}</p>
              </article>
            ))}
          </div>

          <div className="order-footer">
            <h2>Total del Pedido: C${"100"}</h2>
            <button className="action-btn">Confirmar Pedido</button>
          </div>
        </aside>
        <hr className="separator-mobile" />
        <section className="handle-order-container">
          <Outlet></Outlet>
        </section>
      </div>

      <button
        className="return-btn"
        onClick={() => navigate("/waiter-dashboard")}
      >
        <ArrowLeftToLine size={19} />
        Volver
      </button>

      {showNav && (
        <nav className="local-nav shadow">
          <a href="#content-view">
            <ArrowBigUp />
          </a>
          <a href="#order-list">
            <ArrowBigDown />
          </a>
        </nav>
      )}
    </section>
  );
};

export default OrdersHandlerView;
