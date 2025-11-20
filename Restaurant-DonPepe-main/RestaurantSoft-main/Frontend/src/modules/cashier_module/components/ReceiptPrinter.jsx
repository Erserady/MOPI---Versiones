import React, { useRef, useEffect } from "react";
import { X, Printer } from "lucide-react";
import { RESTAURANT_INFO } from "../../../config/restaurant";
import "../styles/receipt_printer.css";

const ReceiptPrinter = ({ isOpen, onClose, receiptData }) => {
  const printRef = useRef();

  useEffect(() => {
    // Auto-abrir el diálogo de impresión cuando se monta el componente
    if (isOpen && receiptData) {
      // Pequeño delay para que el DOM se renderice completamente
      setTimeout(() => {
        handlePrint();
      }, 500);
    }
  }, [isOpen, receiptData]);

  const handlePrint = () => {
    if (!receiptData) return;

    const printWindow = window.open('', '_blank', 'width=302,height=600');
    if (!printWindow) {
      alert('Por favor, habilita las ventanas emergentes para imprimir.');
      return;
    }

    const printContent = printRef.current.innerHTML;

    // Escribir el contenido en la nueva ventana con estilos optimizados para EPSON TM-U220
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket - Mesa ${receiptData?.tableNumber || ''}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            /* Optimizado para EPSON TM-U220 - 76mm roll paper @ 160x144 DPI */
            @page {
              size: 76mm auto; /* Alto dinámico según contenido */
              margin: 0;
            }
            
            @media print {
              @page {
                size: 76mm auto;
                margin: 0;
              }
              
              html, body {
                image-rendering: -webkit-optimize-contrast;
                image-rendering: crisp-edges;
                image-rendering: pixelated;
              }
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Courier New', Courier, monospace;
              padding: 3mm 2mm;
              width: 76mm;
              font-size: 10pt; /* Aumentado para mejor legibilidad en 160DPI */
              line-height: 1.3;
              color: #000;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              font-weight: 500; /* Texto más grueso */
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            
            .receipt-container {
              width: 100%;
            }
            
            .receipt-header {
              text-align: center;
              margin-bottom: 2mm;
            }
            
            .restaurant-name {
              font-weight: 900;
              font-size: 13pt;
              margin-bottom: 1mm;
              letter-spacing: 0.5px;
            }
            
            .restaurant-info {
              font-size: 9pt;
              line-height: 1.4;
              font-weight: 500;
            }
            
            .divider {
              border-bottom: 2px dashed #000;
              margin: 2mm 0;
              height: 2px;
            }
            
            .ticket-info {
              font-size: 9pt;
              margin-bottom: 2mm;
              line-height: 1.4;
              font-weight: 500;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1mm;
            }
            
            .section-title {
              font-weight: 900;
              margin-bottom: 2mm;
              text-align: center;
              font-size: 10pt;
            }
            
            .items-table {
              width: 100%;
              margin: 2mm 0;
              font-size: 9pt;
              font-weight: 500;
            }
            
            .items-table-header {
              font-weight: 900;
              border-bottom: 2px solid #000;
              padding-bottom: 1mm;
              margin-bottom: 1mm;
              display: grid;
              grid-template-columns: 18mm 1fr 16mm 18mm;
              gap: 2mm;
              font-size: 9pt;
            }
            
            .item-row {
              display: grid;
              grid-template-columns: 18mm 1fr 16mm 18mm;
              gap: 2mm;
              margin-bottom: 1mm;
              align-items: start;
              page-break-inside: avoid;
            }
            
            .item-description {
              word-wrap: break-word;
              overflow-wrap: break-word;
              font-size: 9pt;
              font-weight: 500;
            }
            
            .text-right {
              text-align: right;
            }
            
            .payment-section {
              margin-top: 2mm;
              font-size: 9pt;
              font-weight: 500;
            }
            
            .total-section {
              font-weight: 900;
              font-size: 11pt;
              margin-top: 2mm;
              text-align: center;
              page-break-inside: avoid;
            }
            
            .total-amount {
              font-size: 14pt;
              margin: 1mm 0;
              letter-spacing: 1px;
              font-weight: 900;
            }
            
            .footer-section {
              text-align: center;
              margin-top: 3mm;
              font-size: 9pt;
              line-height: 1.5;
              font-weight: 500;
            }
            
            .tip-message {
              font-weight: 900;
              margin: 2mm 0;
            }
            
            .thank-you {
              margin: 2mm 0;
              font-weight: 600;
            }
            
            .attendant {
              margin-top: 2mm;
              font-size: 9pt;
              font-weight: 500;
            }
            
            @media print {
              body {
                padding: 2mm;
              }
              
              .no-print {
                display: none !important;
              }
              
              /* Forzar calidad de impresión */
              * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
          <script>
            // Configurar máxima calidad de impresión
            window.addEventListener('beforeprint', function() {
              // Intentar forzar alta calidad
              if (window.matchMedia) {
                var mediaQueryList = window.matchMedia('print');
                mediaQueryList.addListener(function(mql) {
                  if (mql.matches) {
                    console.log('Imprimiendo con máxima calidad: 160x144 DPI');
                  }
                });
              }
            });
          </script>
        </head>
        <body onload="setTimeout(function() { window.print(); window.onafterprint = function() { window.close(); }; }, 300);">
          <!-- Instrucciones para máxima calidad (solo visibles antes de imprimir) -->
          <div class="no-print" style="padding: 10px; background: #fffbeb; border: 2px solid #f59e0b; border-radius: 8px; margin-bottom: 10px; font-family: Arial, sans-serif;">
            <strong style="color: #92400e; display: block; margin-bottom: 5px;">⚠️ Configuración de Impresión Recomendada:</strong>
            <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 12px; line-height: 1.6;">
              <li>Calidad: <strong>Alta/Máxima (160x144 DPI)</strong></li>
              <li>Tamaño de papel: <strong>76mm (ancho de rollo)</strong></li>
              <li>Márgenes: <strong>0mm</strong></li>
              <li>Escala: <strong>100%</strong></li>
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
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const currentDate = new Date();

  return (
    <>
      <div className="receipt-dialog-overlay" onClick={onClose}>
        <div className="receipt-dialog-container" onClick={(e) => e.stopPropagation()}>
          {/* Header con botones */}
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

          {/* Contenido del ticket */}
          <div className="receipt-preview" ref={printRef}>
            <div className="receipt-container">
              {/* Header del ticket */}
              <div className="receipt-header">
                <div className="restaurant-name">{RESTAURANT_INFO.name}</div>
                <div className="restaurant-info">
                  <div>{RESTAURANT_INFO.address}</div>
                  <div>RUC {RESTAURANT_INFO.ruc} TEL. {RESTAURANT_INFO.phone}</div>
                </div>
              </div>

              <div className="divider"></div>

              {/* Información del ticket */}
              <div className="ticket-info">
                <div className="info-row">
                  <span>TICKET N°{receiptData.ticketNumber || receiptData.facturaId || '0000'}</span>
                  <span>VENDEDOR {receiptData.vendorId || '1'}</span>
                </div>
                <div className="info-row">
                  <span>/{receiptData.correlativo || '001'}</span>
                  <span>HORA: {formatTime(currentDate)}</span>
                </div>
                <div className="info-row">
                  <span>FECHA {formatDate(currentDate)}</span>
                  <span>MESA {receiptData.tableNumber}</span>
                </div>
              </div>

              {/* Cliente (opcional) */}
              {receiptData.customerName && (
                <div className="ticket-info">
                  <div>CLIENTE: {receiptData.customerName}</div>
                  {receiptData.customerAddress && (
                    <div>DIRECCION: {receiptData.customerAddress}</div>
                  )}
                </div>
              )}

              <div className="divider"></div>

              {/* Tabla de productos */}
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

              {/* Forma de pago */}
              <div className="payment-section">
                <div className="section-title">FORMA DE PAGO: {receiptData.paymentMethod === 'cash' ? 'EFECTIVO' : 'TARJETA'}</div>
              </div>

              {/* Total */}
              <div className="total-section">
                <div>TOTAL A PAGAR:</div>
                <div className="total-amount">{receiptData.total.toFixed(2)}</div>
              </div>

              <div className="divider"></div>

              {/* Footer */}
              <div className="footer-section">
                <div className="tip-message">{RESTAURANT_INFO.tipMessage}</div>
                <div className="thank-you">{RESTAURANT_INFO.thankYouMessage}</div>
                <div className="attendant">LE ATENDIO {receiptData.waiterName || receiptData.waiter || 'STAFF'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceiptPrinter;
