import React, { useRef, useEffect } from "react";
import { X, Printer } from "lucide-react";
import { RESTAURANT_INFO } from "../../../config/restaurant";
import "../styles/receipt_printer.css";

const PAPER_WIDTH_MM = 58;
const PRINT_MARGIN_MM = 2;
const PRINT_INNER_WIDTH_MM = PAPER_WIDTH_MM - PRINT_MARGIN_MM * 2;
const ITEM_GRID_TEMPLATE = "8mm 1fr 10mm 10mm";

const ReceiptPrinter = ({ isOpen, onClose, receiptData }) => {
  const printRef = useRef();

  useEffect(() => {
    if (isOpen && receiptData) {
      setTimeout(() => {
        handlePrint();
      }, 500);
    }
  }, [isOpen, receiptData]);

  const handlePrint = () => {
    if (!receiptData) return;

    const printWindowWidth = Math.ceil(
      (PAPER_WIDTH_MM + PRINT_MARGIN_MM * 2) * 3.78
    );
    const printWindow = window.open(
      "",
      "_blank",
      `width=${printWindowWidth},height=700`
    );
    if (!printWindow) {
      alert("Por favor, habilita las ventanas emergentes para imprimir.");
      return;
    }

    const printContent = printRef.current.innerHTML;

    printWindow.document.write(`
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
              padding: ${PRINT_MARGIN_MM}mm;
              width: ${PRINT_INNER_WIDTH_MM}mm;
              max-width: ${PRINT_INNER_WIDTH_MM}mm;
              font-family: "Courier New", monospace;
              font-size: 10px;
              line-height: 1.35;
              color: black;
            }

            .receipt-container {
              width: 100%;
              max-width: ${PRINT_INNER_WIDTH_MM}mm;
            }

            .receipt-header {
              text-align: center;
              margin-bottom: 2mm;
            }

            .restaurant-name {
              font-weight: 700;
              font-size: 11pt;
              margin-bottom: 1mm;
              letter-spacing: 0.3px;
            }

            .restaurant-info {
              font-size: 9pt;
              line-height: 1.3;
              font-weight: 400;
            }

            .divider {
              border-bottom: 1px dashed #000;
              margin: 2mm 0;
              height: 1px;
            }

            .ticket-info {
              font-size: 9pt;
              margin-bottom: 2mm;
              line-height: 1.3;
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
              font-size: 10pt;
            }

            .items-table {
              width: 100%;
              margin: 2mm 0;
              font-size: 9pt;
              font-weight: 400;
            }

            .items-table-header,
            .item-row {
              display: grid;
              grid-template-columns: ${ITEM_GRID_TEMPLATE};
              gap: 1mm;
              align-items: start;
            }

            .items-table-header {
              font-weight: 700;
              border-bottom: 1px solid #000;
              padding-bottom: 1mm;
              margin-bottom: 1mm;
              font-size: 9pt;
            }

            .item-row {
              margin-bottom: 1mm;
              page-break-inside: avoid;
            }

            .item-description {
              word-wrap: break-word;
              overflow-wrap: break-word;
              word-break: break-word;
              font-size: 9pt;
              font-weight: 400;
            }

            .text-right {
              text-align: right;
              white-space: nowrap;
            }

            .no-print { display: none; }

            .payment-section {
              margin-top: 2mm;
              font-size: 9pt;
              font-weight: 400;
            }

            .total-section {
              font-weight: 700;
              font-size: 11pt;
              margin-top: 2mm;
              text-align: center;
              page-break-inside: avoid;
            }

            .total-amount {
              font-size: 14pt;
              margin: 1mm 0;
              letter-spacing: 0.6px;
              font-weight: 700;
            }

            .footer-section {
              text-align: center;
              margin-top: 3mm;
              font-size: 9pt;
              line-height: 1.3;
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
              font-size: 9.5pt;
              font-weight: 400;
            }

            @media print {
              body {
                margin: 0;
                padding: ${PRINT_MARGIN_MM}mm;
                width: ${PRINT_INNER_WIDTH_MM}mm;
                max-width: ${PRINT_INNER_WIDTH_MM}mm;
                font-family: "Courier New", monospace;
                font-size: 10px;
                color: black;
              }

              .no-print {
                display: none !important;
              }

              .receipt-container {
                width: 100%;
                max-width: ${PRINT_INNER_WIDTH_MM}mm;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body onload="setTimeout(function() { window.print(); window.onafterprint = function() { window.close(); }; }, 300);">
          <div class="no-print" style="padding: 10px; background: #fffbeb; border: 2px solid #f59e0b; border-radius: 8px; margin-bottom: 10px; font-family: Arial, sans-serif;">
            <strong style="color: #92400e; display: block; margin-bottom: 5px;">Tip: Configuracion de impresion recomendada</strong>
            <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 12px; line-height: 1.6;">
              <li>Calidad: Alta/Maxima (160x144 DPI)</li>
              <li>Tamano de papel: ${PAPER_WIDTH_MM}mm</li>
              <li>Margenes: 0mm</li>
              <li>Escala: 100%</li>
            </ul>
          </div>
          ${printContent}
        </body>
      </html>
    `);

    printWindow.document.close();
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
                  <span>/{receiptData.correlativo || "001"}</span>
                  <span>HORA: {formatTime(currentDate)}</span>
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
                  <div>UNID.</div>
                  <div>DESCRIPCION</div>
                  <div className="text-right">PRECIO</div>
                  <div className="text-right">IMPORTE</div>
                </div>

                {receiptData.items && receiptData.items.map((item, index) => (
                  <div key={index} className="item-row">
                    <div>{item.quantity}</div>
                    <div className="item-description">{item.name}</div>
                    <div className="text-right">{item.unitPrice.toFixed(2)}</div>
                    <div className="text-right">{(item.quantity * item.unitPrice).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="divider"></div>

              <div className="payment-section">
                <div className="section-title">FORMA DE PAGO: {receiptData.paymentMethod === "cash" ? "EFECTIVO" : "TARJETA"}</div>
              </div>

              <div className="total-section">
                <div>TOTAL A PAGAR:</div>
                <div className="total-amount">{receiptData.total.toFixed(2)}</div>
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
