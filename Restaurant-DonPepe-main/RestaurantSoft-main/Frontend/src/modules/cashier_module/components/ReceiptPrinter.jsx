import React, { useRef, useEffect } from "react";
import { X, Printer } from "lucide-react";
import { RESTAURANT_INFO } from "../../../config/restaurant";
import "../styles/receipt_printer.css";

// Medidas seguras para impresoras termicas de 58mm (ancho imprimible real ~48mm).
const PAPER_WIDTH_MM = 58;
const CONTENT_WIDTH_MM = 48;
const SIDE_PADDING_MM = (PAPER_WIDTH_MM - CONTENT_WIDTH_MM) / 2;
const ITEM_GRID_TEMPLATE = "6mm 1fr 11mm 12mm";
const FONT_STACK = '"SFMono-Regular","Consolas","Courier New",monospace';

const ReceiptPrinter = ({ isOpen, onClose, receiptData }) => {
  const printRef = useRef();
  const hasAutoPrintedRef = useRef(false);

  useEffect(() => {
    if (isOpen && receiptData && !hasAutoPrintedRef.current) {
      hasAutoPrintedRef.current = true;
      setTimeout(() => {
        handlePrint();
      }, 400);
    }
    if (!isOpen) {
      hasAutoPrintedRef.current = false;
    }
  }, [isOpen, receiptData]);

  const formatMoney = (value = 0) => {
    const amount = Number(value) || 0;
    return amount.toFixed(2);
  };

  const handlePrint = () => {
    if (!receiptData) return;
    if (!printRef.current) {
      console.warn("No hay contenido de ticket para imprimir.");
      return;
    }

    const printContent = printRef.current.innerHTML;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const printDocument = iframe.contentDocument || iframe.contentWindow?.document;
    if (!printDocument) {
      document.body.removeChild(iframe);
      alert("No se pudo preparar la impresion. Intente nuevamente.");
      return;
    }

    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("No se pudo abrir el dialogo de impresion", err);
      }
    };

    const cleanUp = () => {
      setTimeout(() => {
        iframe.parentNode?.removeChild(iframe);
      }, 300);
    };

    const onAfterPrint = () => cleanUp();
    if (iframe.contentWindow) {
      iframe.contentWindow.onafterprint = onAfterPrint;
    }

    printDocument.open();
    printDocument.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket - Mesa ${receiptData?.tableNumber || ""}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page {
              margin: 0;
              size: ${PAPER_WIDTH_MM}mm auto;
            }

            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: ${SIDE_PADDING_MM}mm;
              width: ${CONTENT_WIDTH_MM}mm;
              max-width: ${CONTENT_WIDTH_MM}mm;
              margin-left: auto;
              margin-right: auto;
              font-family: ${FONT_STACK};
              font-size: 8pt;
              line-height: 1.35;
              color: black;
              letter-spacing: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .receipt-container {
              width: 100%;
              max-width: ${CONTENT_WIDTH_MM}mm;
            }

            .receipt-header {
              text-align: center;
              margin-bottom: 2mm;
            }

            .restaurant-name {
              font-weight: 700;
              font-size: 9pt;
              margin-bottom: 1mm;
              letter-spacing: 0.3px;
            }

            .restaurant-info {
              font-size: 7.4pt;
              line-height: 1.25;
              font-weight: 400;
            }

            .divider {
              border-bottom: 1px dashed #000;
              margin: 2mm 0;
              height: 1px;
            }

            .ticket-info {
              font-size: 7.4pt;
              margin-bottom: 2mm;
              line-height: 1.25;
              font-weight: 400;
            }

            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1mm;
              gap: 2mm;
            }

            .section-title {
              font-weight: 700;
              margin-bottom: 2mm;
              text-align: center;
              font-size: 8pt;
            }

            .items-table {
              width: 100%;
              margin: 2mm 0;
              font-size: 7.4pt;
              font-weight: 400;
            }

            .items-table-header,
            .item-row {
              display: grid;
              grid-template-columns: ${ITEM_GRID_TEMPLATE};
              gap: 0.6mm;
              align-items: start;
            }

            .items-table-header {
              font-weight: 700;
              border-bottom: 1px solid #000;
              padding-bottom: 1mm;
              margin-bottom: 1mm;
              font-size: 7.4pt;
            }

            .items-table-header div {
              overflow-wrap: anywhere;
            }

            .item-row {
              margin-bottom: 1mm;
              page-break-inside: avoid;
            }

            .item-description {
              word-wrap: break-word;
              overflow-wrap: break-word;
              word-break: break-word;
              font-size: 7.4pt;
              font-weight: 400;
              line-height: 1.35;
            }

            .item-name {
              font-weight: 700;
              letter-spacing: 0.1px;
            }

            .item-qty {
              font-weight: 700;
            }

            .item-note {
              font-size: 7pt;
              opacity: 0.85;
              margin-top: 0.5mm;
            }

            .text-right {
              text-align: right;
              white-space: nowrap;
            }

            .no-print { display: none; }

            .payment-section {
              margin-top: 2mm;
              font-size: 7.4pt;
              font-weight: 400;
            }

            .total-section {
              font-weight: 700;
              font-size: 9.5pt;
              margin-top: 2mm;
              text-align: center;
              page-break-inside: avoid;
            }

            .total-amount {
              font-size: 11pt;
              margin: 1mm 0;
              letter-spacing: 0.6px;
              font-weight: 700;
            }

            .footer-section {
              text-align: center;
              margin-top: 3mm;
              font-size: 7.4pt;
              line-height: 1.25;
              font-weight: 400;
            }

            .tip-message {
              font-weight: 700;
              margin: 2mm 0;
            }

            .thank-you {
              margin: 2mm 0;
              font-weight: 600;
            }

            .attendant {
              margin-top: 2mm;
              font-size: 8pt;
              font-weight: 400;
            }

            @media print {
              body {
                margin: 0;
                padding: ${SIDE_PADDING_MM}mm;
                width: ${CONTENT_WIDTH_MM}mm;
                max-width: ${CONTENT_WIDTH_MM}mm;
                font-family: ${FONT_STACK};
                font-size: 8pt;
                line-height: 1.35;
                color: black;
              }

              .no-print {
                display: none !important;
              }

              .receipt-container {
                width: 100%;
                max-width: ${CONTENT_WIDTH_MM}mm;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="padding: 10px; background: #fffbeb; border: 2px solid #f59e0b; border-radius: 8px; margin-bottom: 10px; font-family: Arial, sans-serif;">
            <strong style="color: #92400e; display: block; margin-bottom: 5px;">Tip: Configuracion de impresion recomendada</strong>
            <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 12px; line-height: 1.6;">
              <li>Calidad: Alta/Maxima (160x144 DPI)</li>
              <li>Tamano de papel: ${PAPER_WIDTH_MM}mm (ancho util ${CONTENT_WIDTH_MM}mm)</li>
              <li>Margenes: 0mm / Centrados</li>
              <li>Escala: 100%</li>
            </ul>
          </div>
          ${printContent}
        </body>
      </html>
    `);
    printDocument.close();

    const readyState = printDocument.readyState;
    if (readyState === "complete") {
      setTimeout(triggerPrint, 200);
    } else {
      iframe.onload = () => setTimeout(triggerPrint, 200);
    }
  };

  if (!isOpen || !receiptData) return null;

  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const currentDate = new Date();

  return (
    <>
      <div className="receipt-dialog-overlay" onClick={onClose}>
        <div className="receipt-dialog-container" onClick={(e) => e.stopPropagation()}>
          <div className="receipt-dialog-header no-print">
            <h2>Ticket - Mesa {receiptData.tableNumber}</h2>
            <div className="header-actions">
              <button className="btn-print" onClick={handlePrint}>
                <Printer size={20} />
                Imprimir
              </button>
              <button className="btn-close" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="receipt-preview" ref={printRef}>
            <div className="receipt-container">
              <div className="receipt-header">
                <div className="restaurant-name">{RESTAURANT_INFO.name}</div>
                <div className="restaurant-info">
                  <div>{RESTAURANT_INFO.address}</div>
                  <div>RUC {RESTAURANT_INFO.ruc} TEL. {RESTAURANT_INFO.phone}</div>
                </div>
              </div>

              <div className="divider"></div>

              <div className="ticket-info">
                <div className="info-row">
                  <span>TICKET No. {receiptData.ticketNumber || receiptData.facturaId || "0000"}</span>
                  <span>VENDEDOR {receiptData.vendorId || "1"}</span>
                </div>
                <div className="info-row">
                  <span>ORDEN {receiptData.correlativo || "001"}</span>
                  <span>HORA {formatTime(currentDate)}</span>
                </div>
                <div className="info-row">
                  <span>FECHA {formatDate(currentDate)}</span>
                  <span>MESA {receiptData.tableNumber}</span>
                </div>
              </div>

              {receiptData.customerName && (
                <div className="ticket-info">
                  <div>CLIENTE: {receiptData.customerName}</div>
                  {receiptData.customerAddress && (
                    <div>DIRECCION: {receiptData.customerAddress}</div>
                  )}
                </div>
              )}

              <div className="divider"></div>

              <div className="items-table">
                <div className="items-table-header">
                  <div>CANT.</div>
                  <div>DETALLE</div>
                  <div className="text-right">P.UNIT</div>
                  <div className="text-right">TOTAL</div>
                </div>

                {receiptData.items && receiptData.items.map((item, index) => {
                  const qty = Number(item.quantity) || 0;
                  const name = item.name || item.description || "Producto";
                  const displayName = qty > 1 ? `${name} x${qty}` : name;
                  const unitPrice = Number(item.unitPrice) || 0;
                  const lineTotal = qty * unitPrice;

                  return (
                    <div key={index} className="item-row">
                      <div className="item-qty">{qty}</div>
                      <div className="item-description">
                        <div className="item-name">{displayName}</div>
                        {item.notes && <div className="item-note">{item.notes}</div>}
                      </div>
                      <div className="text-right">{formatMoney(unitPrice)}</div>
                      <div className="text-right">{formatMoney(lineTotal)}</div>
                    </div>
                  );
                })}
              </div>

              <div className="divider"></div>

              <div className="payment-section">
                <div className="section-title">FORMA DE PAGO: {receiptData.paymentMethod === "cash" ? "EFECTIVO" : "TARJETA"}</div>
              </div>

              <div className="total-section">
                <div>TOTAL A PAGAR:</div>
                <div className="total-amount">{formatMoney(receiptData.total)}</div>
              </div>

              <div className="divider"></div>

              <div className="footer-section">
                <div className="tip-message">{RESTAURANT_INFO.tipMessage}</div>
                <div className="thank-you">{RESTAURANT_INFO.thankYouMessage}</div>
                <div className="attendant">LE ATENDIO {receiptData.waiterName || receiptData.waiter || "STAFF"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceiptPrinter;
