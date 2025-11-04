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

  //Estado de las cuentas
  const [accounts, setAccounts] = useState([]);

  //Función para agregar cuenta
  const addAccount = () => {
    const newAccount = {
      accountId: crypto.randomUUID(),
      label: `Cuenta #${accounts.length + 1}`,
      items: [],
      subtotal: 0,
    };
    setAccounts([...accounts, newAccount]);
  };

  //Eliminar cuenta
  const deleteAccount = (id) => {
    setAccounts((prev) => prev.filter((a) => a.accountId !== id));
  };

  // Cambiar a una cuenta
  const HandleCustomOrder = (accountId) => {
    navigate(`/waiter-dashboard/${tableNumber}/orders-handler/${accountId}`);
  };

  // Calcular total general
  const totalPedido = accounts.reduce((acc, a) => acc + a.subtotal, 0);

  // Mantener navegación interna
  useEffect(() => {
    !showNav ? setShowNav(location.pathname.includes("orders-handler/")) : "";
  }, [location, showNav]);

  return (
    <section className="orders-handler-view">
      <h1 id="content-view">Pedidos para la mesa {tableNumber}</h1>
      <p className="explain-text-desktop">
        Selecciona una cuenta en la parte izquierda para agregarle platillos.
      </p>
      <p>Si no existe cuenta, click en agregar cuenta.</p>

      <div className="content shadow">
        {/* === Panel Izquierdo === */}
        <aside className="orders-container">
          <div className="orders-header">
            <h2>Cuentas</h2>
            <button className="action-btn" onClick={addAccount}>
              <span>+</span> Agregar Cuenta
            </button>
          </div>

          <div className="card-container">
            {accounts.length === 0 ? (
              <p>No hay cuentas creadas.</p>
            ) : (
              accounts.map((acc, index) => (
                <article
                  title="Click para ver detalles"
                  key={acc.accountId}
                  onClick={() => HandleCustomOrder(acc.accountId)}
                  className="order-card shadow"
                >
                  <div>
                    <h3>{acc.label}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAccount(acc.accountId);
                      }}
                    >
                      <Trash2 />
                    </button>
                  </div>
                  <p>Elementos: {acc.items.length}</p>
                  <p>Subtotal: C${acc.subtotal}</p>
                </article>
              ))
            )}
          </div>

          <div className="order-footer">
            <h2>Total del Pedido: C${totalPedido}</h2>
            <button className="action-btn">Confirmar Pedido</button>
          </div>
        </aside>

        <hr className="separator-mobile" />

        {/* === Sección principal === */}
        <section className="handle-order-container">
          {/* Pasaremos las funciones y cuentas como contexto */}
          <Outlet context={{ accounts, setAccounts }} />
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
