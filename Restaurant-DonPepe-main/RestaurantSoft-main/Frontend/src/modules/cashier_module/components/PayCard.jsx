import { useEffect, useMemo, useState } from "react";
import { Receipt, Printer, CreditCard, CircleCheckBig, Wine, X, GlassWater } from "lucide-react";
import PayDialog from "./PayDialog";
import OrderDetailsModal from "./OrderDetailsModal";
import ReceiptPrinter from "./ReceiptPrinter";
import { actualizarEstadoPlatillo } from "../../../services/cookService";

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
  // deliveredBeverages guarda estado entregado por refId (itemUid)
  const [deliveredBeverages, setDeliveredBeverages] = useState({});
  const storageKey = useMemo(() => {
    const base =
      order?.id ||
      order?.orderId ||
      order?.tableId ||
      order?.tableNumber ||
      "unknown";
    return `deliveredBeverages:${base}`;
  }, [order?.id, order?.orderId, order?.tableId, order?.tableNumber]);

  // Hidratar desde sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setDeliveredBeverages(parsed);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [storageKey]);

  const handleOrderCancelled = () => {
    setDetailsModalOpen(false);
    if (onOrderUpdate) onOrderUpdate();
  };

  // Lista base de items de bar (sin agrupar)
  const rawNonCookableItems = useMemo(() => {
    const items = [];
    (order.accounts || []).forEach((account, accIdx) => {
      (account.items || []).forEach((item, idx) => {
        if (!isNonCookableItem(item)) return;
        const name = item.name || item.nombre || "Bebida";
        const price = Number(item.unitPrice ?? item.precio ?? 0);
        const note = item.nota || "";
        const category = item.category || item.categoria || "Bebidas";
        const orderKey = item.orderDbId || item.orderIdentifier || item.orderId || `ord-${accIdx}`;
        const uid =
          item.itemUid ||
          item.item_uid ||
          item.uid ||
          item.id ||
          `${orderKey}-${idx}`;
        const key = `${orderKey}|${uid}`;
        const qty = Number(item.quantity || item.cantidad || item.qty || 1) || 1;
        items.push({
          key,
          baseKey: key,
          name,
          category,
          unitPrice: price,
          note,
          totalQty: qty,
          refs: [
            {
              orderId: item.orderDbId,
              itemUid: uid,
              ready: item.ready === true,
            },
          ],
          backendReady: item.ready === true,
          refId: uid,
          orderKey,
          note,
          price,
        });
      });
    });
    return items;
  }, [order.accounts]);

  // Genera filas para UI separando pendientes vs entregadas por cantidad
  const nonCookableItems = useMemo(() => {
    const buildKey = (d) =>
      `${normalizeText(d.name)}|${d.price}|${normalizeText(d.category)}|${normalizeText(d.note)}`;

    const pendingMap = new Map();
    const deliveredMap = new Map();
    rawNonCookableItems.forEach((item) => {
      const refId = item.refId;
      const isDelivered = item.backendReady || deliveredBeverages[refId];
      const gKey = buildKey(item);

      if (isDelivered) {
        if (!deliveredMap.has(gKey)) {
          deliveredMap.set(gKey, {
            key: `${gKey}|ready`,
            name: item.name,
            category: item.category,
            unitPrice: item.unitPrice,
            note: item.note,
            quantity: 0,
            refs: [],
            allReady: true,
            baseKey: item.baseKey,
          });
        }
        const g = deliveredMap.get(gKey);
        g.quantity += item.totalQty;
        g.refs.push(...item.refs);
      } else {
        if (!pendingMap.has(gKey)) {
          pendingMap.set(gKey, {
            key: `${gKey}|pending`,
            name: item.name,
            category: item.category,
            unitPrice: item.unitPrice,
            note: item.note,
            quantity: 0,
            refs: [],
            refIds: [],
            allReady: false,
            baseKey: item.baseKey,
          });
        }
        const g = pendingMap.get(gKey);
        g.quantity += item.totalQty;
        g.refs.push(...item.refs);
        g.refIds.push(item.refId);
      }
    });

    const rows = [...pendingMap.values(), ...deliveredMap.values()];
    return rows.sort((a, b) => Number(a.allReady) - Number(b.allReady));
  }, [rawNonCookableItems, deliveredBeverages]);

  const pendingGroups = useMemo(
    () => nonCookableItems.filter((item) => !item.allReady),
    [nonCookableItems]
  );
  const deliveredGroups = useMemo(
    () => nonCookableItems.filter((item) => item.allReady),
    [nonCookableItems]
  );

  useEffect(() => {
    setDeliveredBeverages((prev) => {
      const next = {};
      rawNonCookableItems.forEach((item) => {
        const backendReady = item.backendReady === true;
        const prevVal = prev[item.refId] === true;
        // Si alguna vez estuvo entregado en esta sesion o backend lo marca entregado,
        // lo mantenemos como entregado para evitar rebotes por respuestas atrasadas.
        next[item.refId] = backendReady || prevVal;
      });
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  }, [rawNonCookableItems, storageKey]);

  useEffect(() => {
    const allDelivered =
      nonCookableItems.length > 0 &&
      nonCookableItems.every((item) => item.allReady || deliveredBeverages[item.key]);
    setOverrideKitchen(allDelivered);
    if (!nonCookableItems.length) {
      setShowPendingDrinks(false);
    }
  }, [deliveredBeverages, nonCookableItems]);

  const hasNonCookableItems = nonCookableItems.length > 0;
  const anyBeverageDelivered = rawNonCookableItems.some(
    (item) => item.backendReady || deliveredBeverages[item.refId]
  );
  const allBeveragesDelivered =
    rawNonCookableItems.length > 0 &&
    rawNonCookableItems.every((item) => item.backendReady || deliveredBeverages[item.refId]);

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

  const persistBeverageRefs = async (refs) => {
    const targets = (refs || []).filter((ref) => ref.orderId && ref.itemUid);
    if (!targets.length) return false;
    try {
      await Promise.all(
        targets.map((ref) => actualizarEstadoPlatillo(ref.orderId, ref.itemUid, true))
      );
      return true;
    } catch (err) {
      console.error("No se pudo marcar bebida como entregada en backend:", err);
      return false;
    }
  };

  const handleToggleBeverage = async (key) => {
    const beverage = nonCookableItems.find((i) => i.key === key);
    if (!beverage) return;
    const refsToPersist = (beverage.refs || []).filter((ref) => !ref.ready);
    const success = await persistBeverageRefs(refsToPersist);
    if (!success) return;

    setDeliveredBeverages((prev) => {
      const next = { ...prev };
      (beverage.refIds || beverage.refs || []).forEach((idOrRef) => {
        const refId = typeof idOrRef === "string" ? idOrRef : idOrRef.itemUid || idOrRef.orderId;
        if (refId) next[refId] = true;
      });
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  const handleMarkAllBeverages = async () => {
    const allRefs = nonCookableItems.flatMap((item) =>
      (item.refs || []).filter((ref) => !ref.ready)
    );
    const success = await persistBeverageRefs(allRefs);
    if (!success && allRefs.length) return;

    const next = {};
    rawNonCookableItems.forEach((item) => {
      next[item.refId] = true;
    });
    setDeliveredBeverages(next);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next));
    } catch (e) {
      // ignore
    }
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
            <div className="pay-card-header__left">
              <Receipt size={30} />
              <div className="pay-card-text">
                <div className="pay-card-title-row">
                  <h2 className="pay-card-title">Mesa {order.tableNumber}</h2>
                  {hasNonCookableItems && (
                    <div
                      role="button"
                      tabIndex={0}
                      className={`pending-drinks-card ${allBeveragesDelivered ? "delivered" : "pending"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPendingDrinks(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setShowPendingDrinks(true);
                        }
                      }}
                      aria-label={
                        allBeveragesDelivered
                          ? "Bebidas entregadas"
                          : "Bebidas pendientes por entregar"
                      }
                      title={
                        allBeveragesDelivered
                          ? "Bebidas entregadas"
                          : "Bebidas pendientes por entregar"
                      }
                    >
                      <GlassWater size={16} className="pending-drinks-card__icon" />
                      <span className="pending-drinks-card__label">
                        {allBeveragesDelivered ? "Bebidas" : "Pendientes"}
                      </span>
                    </div>
                  )}
                </div>
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
          </div>
        </section>
        <div className="check-paid" style={{ display: "none" }}>
          <CircleCheckBig size={30} />
        </div>
      </article>

      {showPendingDrinks && (
        <div className="pending-drinks-overlay" onClick={() => setShowPendingDrinks(false)}>
          <div className="beverage-modal" onClick={(e) => e.stopPropagation()}>
            <header className="beverage-modal__header">
              <div>
                <p className="beverage-modal__eyebrow">Control de bar</p>
                <h3>{allBeveragesDelivered ? "Bebidas" : "Bebidas pendientes"}</h3>
                <span
                  className={`beverage-modal__status ${allBeveragesDelivered ? "" : "pending"
                    }`}
                >
                  {allBeveragesDelivered ? "Todo entregado" : "Faltan bebidas"}
                </span>
                <p className="beverage-modal__subtitle">
                  {allBeveragesDelivered
                    ? "Todas las bebidas están registradas como entregadas."
                    : "Marca las bebidas de bar como entregadas para desbloquear el cobro."}
                </p>
              </div>
              <button
                className="beverage-modal__close"
                onClick={() => setShowPendingDrinks(false)}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </header>

            <div className="beverage-modal__body">
              <section className="beverage-panel">
                <div className="beverage-panel__head">
                  <div>
                    <p className="beverage-panel__eyebrow">Pendientes</p>
                    <h4 className="beverage-panel__title">Por entregar</h4>
                  </div>
                  <span
                    className={`badge ${pendingGroups.length ? "badge--warning" : "badge--success"
                      }`}
                  >
                    {pendingGroups.length} items
                  </span>
                </div>

                {pendingGroups.length ? (
                  <div className="beverage-list">
                    {pendingGroups.map((item) => (
                      <div key={item.key} className="beverage-row">
                        <div className="beverage-row__info">
                          <span className="beverage-row__title">{item.name}</span>
                          <div className="beverage-row__meta">
                            <span className="badge badge--warning">x{item.quantity}</span>
                            <span className="badge badge--cat">{item.category}</span>
                            {item.note && (
                              <span className="beverage-row__note">Nota: {item.note}</span>
                            )}
                          </div>
                        </div>
                        <label className="beverage-row__toggle">
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => handleToggleBeverage(item.key)}
                          />
                          Entregar
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="beverage-empty">
                    No hay bebidas pendientes de entrega en este momento.
                  </div>
                )}
              </section>

              <section className="beverage-panel muted">
                <div className="beverage-panel__head">
                  <div>
                    <p className="beverage-panel__eyebrow">Entregadas</p>
                    <h4 className="beverage-panel__title">Historial reciente</h4>
                  </div>
                  <span className="badge badge--success">
                    {deliveredGroups.length} items
                  </span>
                </div>

                {deliveredGroups.length ? (
                  <div className="beverage-list">
                    {deliveredGroups.map((item) => (
                      <div key={item.key} className="beverage-row is-delivered">
                        <div className="beverage-row__info">
                          <span className="beverage-row__title">{item.name}</span>
                          <div className="beverage-row__meta">
                            <span className="badge badge--success">x{item.quantity}</span>
                            <span className="badge badge--cat">{item.category}</span>
                            {item.note && (
                              <span className="beverage-row__note">Nota: {item.note}</span>
                            )}
                          </div>
                        </div>
                        <label className="beverage-row__toggle" aria-label="Entregado">
                          <input type="checkbox" checked readOnly />
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="beverage-empty">
                    Aún no hay bebidas marcadas como entregadas.
                  </div>
                )}
              </section>
            </div>

            <div className="beverage-modal__footer">
              <div className="beverage-modal__actions">
                <button className="btn-ghost" onClick={() => setShowPendingDrinks(false)}>
                  Cerrar
                </button>
                <button
                  className="btn-cta"
                  onClick={handleMarkAllBeverages}
                  disabled={pendingGroups.length === 0}
                >
                  {allBeveragesDelivered ? "Todo entregado" : "Marcar todo entregado"}
                </button>
              </div>
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
