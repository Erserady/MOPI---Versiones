import { useState, useMemo } from "react";
import { Receipt, Printer, CreditCard, CircleCheckBig } from "lucide-react";
import PayDialog from "./PayDialog";
import OrderDetailsModal from "./OrderDetailsModal";
import ReceiptPrinter from "./ReceiptPrinter";

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

  const handleOrderCancelled = () => {
    setDetailsModalOpen(false);
    if (onOrderUpdate) onOrderUpdate();
  };

  const kitchenBlocked = order.kitchenHold && !overrideKitchen;
  const kitchenBlockedText =
    "Hay platillos en cocina. Espera a que cocina termine antes de cobrar.";

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

  return (
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
        {order.kitchenHold && (
          <div className="pay-card-subtitle" style={{ color: "#b45309" }}>
            ⚠ Pendiente en cocina. Revisa y marca productos en el detalle antes de cobrar.
          </div>
        )}
        <div className="pay-card-actions">
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
      </section>
      <div className="check-paid" style={{ display: "none" }}>
        <CircleCheckBig size={30} />
      </div>
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
        overrideKitchen={overrideKitchen}
        onOverrideChange={setOverrideKitchen}
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
    </article>
  );
};

export default PayCard;
