import React, { useEffect, useRef } from "react";
import { X, Printer } from "lucide-react";
import { RESTAURANT_INFO } from "../../../config/restaurant";
import "../styles/receipt_printer.css";

const PAPER_WIDTH_MM = 58;
const PRINT_MARGIN_MM = 2;
const PRINT_INNER_WIDTH_MM = PAPER_WIDTH_MM - PRINT_MARGIN_MM * 2;

const CloseReceiptPrinter = ({ isOpen, onClose, data }) => {
  const printRef = useRef();
  const hasAutoPrintedRef = useRef(false);

  useEffect(() => {
    if (isOpen && data && !hasAutoPrintedRef.current) {
      hasAutoPrintedRef.current = true;
      setTimeout(() => {
        handlePrint();
      }, 400);
    }

    if (!isOpen) {
      hasAutoPrintedRef.current = false;
    }
  }, [isOpen, data]);

  const handlePrint = () => {
    if (!data) return;
    if (!printRef.current) {
      console.warn("No hay contenido de cierre para imprimir.");
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
      alert("No se pudo preparar la impresión de cierre. Intente nuevamente.");
      return;
    }

    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("No se pudo abrir el diálogo de impresión", err);
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
          <title>Cierre de Caja ${data?.closureNumber || ""}</title>
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
              font-size: 8px;
              line-height: 1.25;
              color: black;
            }

            .receipt-container { width: 100%; max-width: ${PRINT_INNER_WIDTH_MM}mm; }
            .receipt-header { text-align: center; margin-bottom: 2mm; }
            .restaurant-name { font-weight: 700; font-size: 9pt; margin-bottom: 1mm; letter-spacing: 0.3px; }
            .restaurant-info { font-size: 7.5pt; line-height: 1.25; font-weight: 400; }
            .divider { border-bottom: 1px dashed #000; margin: 2mm 0; height: 1px; }
            .ticket-info { font-size: 7.5pt; margin-bottom: 2mm; line-height: 1.25; font-weight: 400; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 1mm; gap: 2mm; }
            .section-title { font-weight: 700; margin-bottom: 2mm; text-align: center; font-size: 8.5pt; }
            .summary-table { width: 100%; margin-bottom: 2mm; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 1mm; font-size: 7.5pt; }
            .summary-row strong { font-weight: 700; }
            .mini-table { width: 100%; border: 1px solid #000; border-radius: 2px; padding: 1mm; }
            .mini-header, .mini-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1mm; font-size: 7.5pt; }
            .mini-header { font-weight: 700; border-bottom: 1px solid #000; padding-bottom: 1mm; margin-bottom: 1mm; }
            .mini-row { margin-bottom: 0.5mm; }
            .text-right { text-align: right; }
            .thank-you { text-align: center; font-weight: 600; margin-top: 2mm; }
            .no-print { display: none; }

            @media print {
              body {
                margin: 0;
                padding: ${PRINT_MARGIN_MM}mm;
                width: ${PRINT_INNER_WIDTH_MM}mm;
                max-width: ${PRINT_INNER_WIDTH_MM}mm;
                font-family: "Courier New", monospace;
                font-size: 8px;
                line-height: 1.25;
                color: black;
              }
              .no-print { display: none !important; }
              .receipt-container { width: 100%; max-width: ${PRINT_INNER_WIDTH_MM}mm; box-shadow: none; }
            }
          </style>
        </head>
        <body>
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

  if (!isOpen || !data) return null;

  const formatText = (value, fallback = "N/D") =>
    value === undefined || value === null ? fallback : String(value);

  return (
    <div className="receipt-dialog-overlay" onClick={onClose}>
      <div className="receipt-dialog-container" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-dialog-header no-print">
          <h2>Cierre de Caja</h2>
          <div className="header-actions">
            <button className="btn-print" onClick={handlePrint}>
              <Printer size={20} />
              Imprimir cierre
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
                <span>CIERRE No. {formatText(data.closureNumber)}</span>
                <span>CAJA {formatText(data.cashRegisterNumber, "1")}</span>
              </div>
              <div className="info-row">
                <span>FECHA {formatText(data.date)}</span>
                <span>HORA: {formatText(data.time)}</span>
              </div>
              <div className="info-row">
                <span>USUARIO</span>
                <span>{formatText(data.user)}</span>
              </div>
            </div>

            <div className="divider"></div>

            <div className="section-title">RESUMEN DEL DÍA</div>
            <div className="summary-table">
              <div className="summary-row">
                <span>Comensales</span>
                <strong>{formatText(data.comensales, 0)}</strong>
              </div>
              <div className="summary-row">
                <span>Facturas: {formatText(data.facturasInicio)} - {formatText(data.facturasFin)}</span>
                <strong>{formatText(data.totalFacturas, 0)} en total</strong>
              </div>
              <div className="summary-row">
                <span>Importe facturas</span>
                <strong>C$ {Number(data.totalFacturasMonto || 0).toFixed(2)}</strong>
              </div>
              <div className="summary-row">
                <span>IVA</span>
                <strong>C$ {Number(data.iva || 0).toFixed(2)}</strong>
              </div>
              <div className="summary-row">
                <span>Mov. caja (egresos)</span>
                <strong>{data.egresosCount || 0} | C$ {Number(data.egresosTotal || 0).toFixed(2)}</strong>
              </div>
              <div className="summary-row">
                <span>Ventas Efectivo</span>
                <strong>C$ {Number(data.ventasEfectivo || 0).toFixed(2)}</strong>
              </div>
              <div className="summary-row">
                <span>Ventas Tarjeta</span>
                <strong>C$ {Number(data.ventasTarjeta || 0).toFixed(2)}</strong>
              </div>
              <div className="summary-row">
                <span>Saldo inicial / final</span>
                <strong>C$ {Number(data.saldoInicial || 0).toFixed(2)} → C$ {Number(data.saldoFinal || 0).toFixed(2)}</strong>
              </div>
            </div>

            {data.facturasDetalle?.length > 0 && (
              <>
                <div className="divider"></div>
                <div className="section-title">IMPORTE DE FACTURAS</div>
                <div className="mini-table">
                  <div className="mini-header">
                    <div>FACT.</div>
                    <div className="text-right">TOTAL</div>
                  </div>
                  {data.facturasDetalle.map((fact, idx) => (
                    <div key={`${fact.numero || idx}`} className="mini-row">
                      <div>{formatText(fact.numero, "N/D")}</div>
                      <div className="text-right">C$ {Number(fact.total || 0).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="divider"></div>
            <div className="thank-you">FIN DEL CIERRE</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloseReceiptPrinter;
