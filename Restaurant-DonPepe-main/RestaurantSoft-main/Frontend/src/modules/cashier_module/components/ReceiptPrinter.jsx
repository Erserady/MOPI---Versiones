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
    if (!printRef.current) return;

    // Crear una ventana de impresión
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permite las ventanas emergentes para imprimir el ticket');
      return;
    }

    // Obtener el contenido HTML del ticket
    const printContent = printRef.current.innerHTML;

    // Escribir el contenido en la nueva ventana con estilos
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket - Mesa ${receiptData?.tableNumber || ''}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Courier New', Courier, monospace;
              padding: 10px;
              width: 80mm;
              font-size: 12px;
            }
            
            .receipt-container {
              width: 100%;
            }
            
            .receipt-header {
              text-align: center;
              margin-bottom: 10px;
            }
            
            .restaurant-name {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 5px;
            }
            
            .restaurant-info {
              font-size: 11px;
              line-height: 1.4;
            }
            
            .divider {
              border-bottom: 1px dashed #333;
              margin: 10px 0;
            }
            
            .ticket-info {
              font-size: 11px;
              margin-bottom: 10px;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            
            .section-title {
              font-weight: bold;
              margin-bottom: 5px;
              text-align: center;
            }
            
            .items-table {
              width: 100%;
              margin: 10px 0;
              font-size: 11px;
            }
            
            .items-table-header {
              font-weight: bold;
              border-bottom: 1px solid #333;
              padding-bottom: 3px;
              margin-bottom: 5px;
              display: grid;
              grid-template-columns: 30px 1fr 60px 60px;
              gap: 5px;
            }
            
            .item-row {
              display: grid;
              grid-template-columns: 30px 1fr 60px 60px;
              gap: 5px;
              margin-bottom: 5px;
              align-items: start;
            }
            
            .item-description {
              word-wrap: break-word;
            }
            
            .text-right {
              text-align: right;
            }
            
            .payment-section {
              margin-top: 10px;
              font-size: 11px;
            }
            
            .total-section {
              font-weight: bold;
              font-size: 13px;
              margin-top: 10px;
              text-align: center;
            }
            
            .total-amount {
              font-size: 16px;
              margin: 5px 0;
            }
            
            .footer-section {
              text-align: center;
              margin-top: 15px;
              font-size: 12px;
            }
            
            .tip-message {
              font-weight: bold;
              margin: 10px 0;
            }
            
            .thank-you {
              margin: 10px 0;
            }
            
            .attendant {
              margin-top: 10px;
              font-size: 11px;
            }
            
            @media print {
              body {
                padding: 0;
              }
              
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body onload="window.print(); window.onafterprint = function() { window.close(); }">
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
