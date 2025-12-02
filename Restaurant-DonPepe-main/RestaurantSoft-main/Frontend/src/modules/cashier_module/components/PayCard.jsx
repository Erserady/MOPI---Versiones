import { useEffect, useMemo, useState } from "react";
import { Receipt, Printer, CreditCard, CircleCheckBig, Clock, X } from "lucide-react";
import PayDialog from "./PayDialog";
import OrderDetailsModal from "./OrderDetailsModal";
import ReceiptPrinter from "./ReceiptPrinter";

// Categorias/keywords que NO pasan por cocina (bebidas/bar)
const CATEGORY_EXCLUDE_LIST = [
  "licores importados",
  "cerveza nacional",
  "cerveza internacional",
  "coctails y vinos",
  "cocteles y vinos",
  "ron nacional",
  "enlatados y desechables",
  "cigarros",
];

const PRODUCT_NAME_KEYWORDS = ["hielo", "empaque", "valde", "cafe", "limon"];

const normalizeText = (value) =>
  (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const isNonCookableItem = (item = {}) => {
  const category = normalizeText(item.categoria || item.category || "principal");
  if (CATEGORY_EXCLUDE_LIST.some((c) => normalizeText(c) === category)) return true;

  const name = normalizeText(item.nombre || item.name || "");
  if (!name) return false;
  return PRODUCT_NAME_KEYWORDS.some((kw) => name.includes(normalizeText(kw)));
};

const PayCard = ({ order, onOrderUpdate }) => {
  const formatStatus = (value) => {
    if (!value) return "Desconocido";
    const textVal = String(value).replace(/_/g, " ").trim().toLowerCase();
    return textVal
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [overrideKitchen, setOverrideKitchen] = useState(false);
  const [showPendingDrinks, setShowPendingDrinks] = useState(false);
  const [deliveredBeverages, setDeliveredBeverages] = useState({});

  const handleOrderCancelled = () => {
    setDetailsModalOpen(false);
    if (onOrderUpdate) onOrderUpdate();
  };

  const nonCookableItems = useMemo(() => {
    const grouped = new Map();
    (order.accounts || []).forEach((account) => {
      (account.items || []).forEach((item) => {
        if (!isNonCookableItem(item)) return;
        const name = item.name || item.nombre || "Bebida";
        const price = Number(item.unitPrice ?? item.precio ?? 0);
        const note = item.nota || "";
        const category = item.category || item.categoria || "Bebidas";
        const key = `${normalizeText(name)}|${price}|${normalizeText(category)}|${normalizeText(note)}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            key,
            name,
            category,
            unitPrice: price,
            note,
            quantity: 0,
          });
        }
        const entry = grouped.get(key);
        entry.quantity += Number(item.quantity || item.cantidad || 0) || 1;
      });
    });
    const result = Array.from(grouped.values()).map((item) => ({
      ...item,
      key: `${item.key}|q${item.quantity}`,
    }));
    return result;
  }, [order.accounts]);

  useEffect(() => {
    setDeliveredBeverages((prev) => {
      const next = {};
      nonCookableItems.forEach((item) => {
        next[item.key] = prev[item.key] || false;
      });
      return next;
    });
  }, [nonCookableItems]);

  useEffect(() => {
    const allDelivered =
      nonCookableItems.length > 0 &&
      nonCookableItems.every((item) => deliveredBeverages[item.key]);
    setOverrideKitchen(allDelivered);
    if (!nonCookableItems.length) {
      setShowPendingDrinks(false);
    }
  }, [deliveredBeverages, nonCookableItems]);

  const hasNonCookableItems = nonCookableItems.length > 0;
  const anyBeverageDelivered = Object.values(deliveredBeverages).some(Boolean);
  const allBeveragesDelivered =
    hasNonCookableItems && nonCookableItems.every((item) => deliveredBeverages[item.key]);

  const nonCookableBlocked = order.nonCookableOnly && !overrideKitchen;
  const kitchenBlocked = !!order.kitchenHold || nonCookableBlocked;
  const kitchenBlockedText = nonCookableBlocked
    ? "Marca los productos de bar/bebidas en \"Bebidas pendientes\" como entregados para poder cobrar."
    : "Hay platillos en cocina. Espera a que cocina termine antes de cobrar.";

  // Agrupar items por nombre para el ticket
  const groupedItems = useMemo(() => {
    if (!order.accounts || order.accounts.length === 0) return [];

    const itemsMap = new Map();
    order.accounts.forEach((account) => {
      account.items.forEach((item) => {
        const key = item.name;
        if (itemsMap.has(key)) {
          const existing = itemsMap.get(key);
          existing.quantity += item.quantity || 0;
          existing.total += item.subtotal || 0;
        } else {
          itemsMap.set(key, {
            name: item.name,
            quantity: item.quantity || 0,
            unitPrice: item.unitPrice || 0,
            total: item.subtotal || 0,
            nota: item.nota || "",
            category: item.category || "Otros",
          });
        }
      });
    });

    return Array.from(itemsMap.values());
  }, [order.accounts]);

  const handleCardClick = (e) => {
    if (!e.target.closest("button") && !e.target.closest("input")) {
      setDetailsModalOpen(true);
    }
  };

  const handlePrintTicket = (e) => {
    e.stopPropagation();

    setShowReceipt(true);
  };

  const handleToggleBeverage = (key) => {
    setDeliveredBeverages((prev) => {
      if (prev[key]) return prev;
      return { ...prev, [key]: true };
    });
  };

  const handleMarkAllBeverages = () => {
    const next = {};
    nonCookableItems.forEach((item) => {
      next[item.key] = true;
    });
    setDeliveredBeverages(next);
  };

  return (
    <>
      <article
        className="pay-card shadow"
        onClick={handleCardClick}
        style={{ cursor: "pointer" }}
      >
        <section className="pay-card-body">
          <div className="pay-card-header">
            <Receipt size={30} />
            <div className="pay-card-text">
              <h2 className="pay-card-title">Mesa {order.tableNumber}</h2>
              <p className="pay-card-subtitle">
                <span className="waiter">Mesero:</span> {order.waiter}
              </p>
              <p className="pay-card-subtitle">
                <span className="account">Estado:</span>{" "}
                {formatStatus(
                  order.status || order.kitchenStatuses?.[0]?.estado || "desconocido"
                )}
              </p>
              <p className="pay-card-subtitle">
                <span className="account">Cuentas pendientes:</span>{" "}
                {order.accounts.filter((item) => item.isPaid == false).length}{" "}
              </p>
              <span className="pay-card-total">
                <span className="total">Total:</span> C${order.total.toFixed(2)}
              </span>
            </div>
          </div>
          {kitchenBlocked && (
            <div className="pay-card-subtitle" style={{ color: "#dc2626" }}>
              Atencion: Pedido no entregado
            </div>
          )}
          <div className="pay-card-actions">
            <div className="pay-card-actions__row">
              <button
                className="shadow paid"
                onClick={() => setDialogOpen(true)}
                disabled={kitchenBlocked}
                title={kitchenBlocked ? kitchenBlockedText : undefined}
              >
                <CreditCard size={20} /> Procesar Pago
              </button>
              <button
                className="shadow ticket"
                onClick={handlePrintTicket}
                title="Imprimir pre-cuenta o ticket"
              >
                <Printer size={20} /> Imprimir Ticket
              </button>
            </div>
            {hasNonCookableItems && (
              <button
                className="shadow pending-drinks"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPendingDrinks(true);
                }}
                title={
                  allBeveragesDelivered
                    ? "Todas las bebidas ya fueron marcadas como entregadas."
                    : "Marca las bebidas/bar que ya entregaste."
                }
              >
                <Clock size={18} />
                Bebidas pendientes
                {allBeveragesDelivered && <CircleCheckBig size={16} />}
              </button>
            )}
          </div>
        </section>
        <div className="check-paid" style={{ display: "none" }}>
          <CircleCheckBig size={30} />
        </div>
      </article>

      {showPendingDrinks && (
        <div className="pending-drinks-overlay" onClick={() => setShowPendingDrinks(false)}>
          <div
            className="pending-drinks-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pending-drinks-header">
              <div>
                <h3>Bebidas pendientes</h3>
                <p>Marca las bebidas de bar como entregadas para desbloquear el cobro.</p>
              </div>
              <button className="pending-drinks-close" onClick={() => setShowPendingDrinks(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="pending-drinks-list">
              {nonCookableItems.map((item) => (
                <label key={item.key} className="pending-drinks-item">
                  <div className="pending-drinks-info">
                    <span className="pending-drinks-name">{item.name}</span>
                    <div className="pending-drinks-meta">
                      <span className="pending-drinks-qty">x{item.quantity}</span>
                      <span className="pending-drinks-tag">{item.category}</span>
                    </div>
                    {item.note && <small className="pending-drinks-note">Nota: {item.note}</small>}
                  </div>
                  <input
                    type="checkbox"
                    checked={!!deliveredBeverages[item.key]}
                    disabled={!!deliveredBeverages[item.key]}
                    onChange={() => handleToggleBeverage(item.key)}
                  />
                </label>
              ))}
            </div>
            <div className="pending-drinks-footer">
              <button className="pending-drinks-secondary" onClick={() => setShowPendingDrinks(false)}>
                Cerrar
              </button>
              <button
                className="pending-drinks-primary"
                onClick={handleMarkAllBeverages}
                disabled={allBeveragesDelivered}
              >
                {allBeveragesDelivered ? "Todo entregado" : "Marcar todo entregado"}
              </button>
            </div>
          </div>
        </div>
      )}

      <PayDialog
        orders={{ ...order, kitchenHold: kitchenBlocked }}
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
      />
      <OrderDetailsModal
        order={order}
        isOpen={isDetailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        onOrderCancelled={handleOrderCancelled}
        onOrderUpdated={onOrderUpdate}
        hasDeliveredBarItems={anyBeverageDelivered || allBeveragesDelivered}
      />
      <ReceiptPrinter
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        receiptData={
          showReceipt
            ? {
                ticketNumber: `PRE-${order.mesaId || order.tableId}`,
                facturaId: "PRE-CUENTA",
                correlativo: String(order.mesaId || order.tableId).padStart(
                  3,
                  "0"
                ),
                vendorId: 1,
                tableNumber: order.tableNumber,
                waiter: order.waiter,
                waiterName: order.waiter,
                customerName: "",
                customerAddress: "",
                items: groupedItems,
                paymentMethod: "cash",
                total: order.total,
                cashReceived: 0,
                change: 0,
              }
            : null
        }
      />
    </>
  );
};

export default PayCard;
