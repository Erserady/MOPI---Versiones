import * as XLSX from 'xlsx';

/**
 * Genera un reporte detallado de caja en formato Excel
 * @param {Object} params - Parámetros del reporte
 * @param {Array} params.transactions - Array de transacciones/pagos
 * @param {Object} params.cajaInfo - Información de la caja
 * @param {string} params.reportType - Tipo de reporte ('day' o 'month')
 * @param {string} params.dateInfo - Información de la fecha del reporte
 * @returns {void} - Genera y descarga el archivo Excel
 */
export function generateDetailedCashReport({
  transactions,
  cajaInfo,
  reportType,
  dateInfo,
  cajeroName = 'N/D'
}) {
  try {
    // Ordenar transacciones por fecha
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    const workbook = XLSX.utils.book_new();
    const formatCurrency = (value) => Number(parseFloat(value || 0).toFixed(2));

    // ===== HOJA 1: RESUMEN =====
    const summaryData = [];
    
    // Encabezado
    summaryData.push(['REPORTE DETALLADO DE CAJA']);
    summaryData.push([]);
    
    // Información de la caja
    summaryData.push(['INFORMACIÓN DE LA CAJA']);
    summaryData.push(['Caja:', cajaInfo?.numero_caja || cajaInfo?.nombre || cajaInfo?.id || 'N/D']);
    summaryData.push(['Estado:', cajaInfo?.estado || 'N/D']);
    summaryData.push(['Responsable:', cajeroName]);
    summaryData.push(['Saldo Inicial:', formatCurrency(cajaInfo?.saldo_inicial)]);
    if (cajaInfo?.fecha_apertura) {
      summaryData.push(['Fecha de Apertura:', new Date(cajaInfo.fecha_apertura).toLocaleString('es-NI')]);
    }
    summaryData.push([]);
    
    // Información del reporte
    summaryData.push(['INFORMACIÓN DEL REPORTE']);
    summaryData.push(['Tipo:', reportType === 'day' ? 'Reporte Diario' : 'Reporte Mensual']);
    summaryData.push(['Período:', dateInfo]);
    summaryData.push(['Generado:', new Date().toLocaleString('es-NI')]);
    summaryData.push(['Total de Transacciones:', sortedTransactions.length]);
    summaryData.push([]);
    
    // Calcular totales
    const totalEfectivo = sortedTransactions
      .filter(t => t.metodo_pago === 'efectivo')
      .reduce((sum, t) => sum + parseFloat(t.monto || 0), 0);
    
    const totalTarjeta = sortedTransactions
      .filter(t => t.metodo_pago === 'tarjeta')
      .reduce((sum, t) => sum + parseFloat(t.monto || 0), 0);
    
    const totalGeneral = totalEfectivo + totalTarjeta;
    const saldoFinal = formatCurrency(cajaInfo?.saldo_inicial || 0) + totalEfectivo;
    
    // Resumen de totales
    summaryData.push(['RESUMEN DE VENTAS']);
    summaryData.push(['Total Efectivo:', formatCurrency(totalEfectivo)]);
    summaryData.push(['Total Tarjeta:', formatCurrency(totalTarjeta)]);
    summaryData.push(['Total General:', formatCurrency(totalGeneral)]);
    summaryData.push(['Saldo Final en Caja (efectivo):', formatCurrency(saldoFinal)]);
    summaryData.push([]);
    
    // Estadísticas adicionales
    summaryData.push(['ESTADÍSTICAS']);
    summaryData.push(['Transacciones en Efectivo:', sortedTransactions.filter(t => t.metodo_pago === 'efectivo').length]);
    summaryData.push(['Transacciones con Tarjeta:', sortedTransactions.filter(t => t.metodo_pago === 'tarjeta').length]);
    summaryData.push(['Ticket Promedio:', formatCurrency(totalGeneral / sortedTransactions.length || 0)]);
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    // ===== HOJA 2: TRANSACCIONES DETALLADAS =====
    const transactionHeaders = [
      '#',
      'Fecha',
      'Hora',
      'Mesa',
      'Número de Factura',
      'Método de Pago',
      'Monto',
      'Mesero',
      'Cajero',
      'Notas'
    ];
    
    const transactionRows = sortedTransactions.map((transaction, index) => {
      const factura = transaction.factura_detalle || transaction.factura;
      const fecha = new Date(transaction.created_at);
      const mesa = factura?.table?.number
        ? `Mesa ${factura.table.number}`
        : factura?.mesa || factura?.mesa_nombre || 'N/D';
      const mesero = factura?.mesero_asignado ||
        factura?.orders?.[0]?.waiter_name ||
        factura?.orders?.[0]?.mesero ||
        transaction.waiter_name || 'Sin asignar';
      
      return {
        '#': index + 1,
        'Fecha': fecha.toLocaleDateString('es-NI'),
        'Hora': fecha.toLocaleTimeString('es-NI'),
        'Mesa': mesa,
        'Número de Factura': factura?.numero_factura || factura?.id || 'N/D',
        'Método de Pago': transaction.metodo_pago === 'efectivo' ? 'Efectivo' : 'Tarjeta',
        'Monto': formatCurrency(transaction.monto),
        'Mesero': mesero,
        'Cajero': cajeroName,
        'Notas': transaction.observaciones || transaction.nota || factura?.observaciones || ''
      };
    });
    
    const transactionSheet = XLSX.utils.json_to_sheet(transactionRows, { header: transactionHeaders });
    transactionSheet['!cols'] = [
      { wch: 5 },  // #
      { wch: 12 }, // Fecha
      { wch: 10 }, // Hora
      { wch: 12 }, // Mesa
      { wch: 18 }, // Número Factura
      { wch: 15 }, // Método Pago
      { wch: 12 }, // Monto
      { wch: 18 }, // Mesero
      { wch: 18 }, // Cajero
      { wch: 35 }  // Notas
    ];
    XLSX.utils.book_append_sheet(workbook, transactionSheet, 'Transacciones');

    // ===== HOJA 3: DETALLE POR PRODUCTO =====
    // Extraer todos los productos de todas las transacciones
    const productosMap = new Map();
    
    sortedTransactions.forEach(transaction => {
      const factura = transaction.factura_detalle || transaction.factura;
      if (factura?.orders && Array.isArray(factura.orders)) {
        factura.orders.forEach(order => {
          if (order.products && Array.isArray(order.products)) {
            order.products.forEach(product => {
              const productName = product.name || product.plato_nombre || 'Producto sin nombre';
              const quantity = product.quantity || product.cantidad || 0;
              const price = product.price || product.precio || 0;
              const subtotal = product.subtotal || (quantity * price) || 0;
              
              if (productosMap.has(productName)) {
                const existing = productosMap.get(productName);
                existing.cantidad += quantity;
                existing.total += subtotal;
              } else {
                productosMap.set(productName, {
                  nombre: productName,
                  cantidad: quantity,
                  precio_unitario: price,
                  total: subtotal
                });
              }
            });
          }
        });
      }
    });
    
    const productHeaders = ['Producto', 'Cantidad Vendida', 'Precio Unitario', 'Total Vendido'];
    const productRows = Array.from(productosMap.values())
      .sort((a, b) => b.total - a.total)
      .map(p => ({
        'Producto': p.nombre,
        'Cantidad Vendida': p.cantidad,
        'Precio Unitario': formatCurrency(p.precio_unitario),
        'Total Vendido': formatCurrency(p.total)
      }));
    
    if (productRows.length > 0) {
      const productSheet = XLSX.utils.json_to_sheet(productRows, { header: productHeaders });
      productSheet['!cols'] = [
        { wch: 35 }, // Producto
        { wch: 18 }, // Cantidad
        { wch: 18 }, // Precio Unitario
        { wch: 18 }  // Total
      ];
      
      // Agregar total al final
      const totalRow = productRows.length + 2;
      XLSX.utils.sheet_add_aoa(
        productSheet,
        [
          [''],
          ['TOTAL GENERAL:', '', '', formatCurrency(productRows.reduce((sum, p) => sum + parseFloat(p['Total Vendido']), 0))]
        ],
        { origin: `A${totalRow}` }
      );
      
      XLSX.utils.book_append_sheet(workbook, productSheet, 'Detalle por Producto');
    }

    // ===== HOJA 4: RESUMEN POR MÉTODO DE PAGO =====
    const paymentMethodData = [
      ['RESUMEN POR MÉTODO DE PAGO'],
      [],
      ['Método de Pago', 'Cantidad de Transacciones', 'Monto Total'],
      ['Efectivo', sortedTransactions.filter(t => t.metodo_pago === 'efectivo').length, formatCurrency(totalEfectivo)],
      ['Tarjeta', sortedTransactions.filter(t => t.metodo_pago === 'tarjeta').length, formatCurrency(totalTarjeta)],
      [],
      ['TOTAL', sortedTransactions.length, formatCurrency(totalGeneral)]
    ];
    
    const paymentMethodSheet = XLSX.utils.aoa_to_sheet(paymentMethodData);
    paymentMethodSheet['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, paymentMethodSheet, 'Por Método de Pago');

    // Generar nombre de archivo
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .split('.')[0];
    
    const cajaId = cajaInfo?.numero_caja || cajaInfo?.id || 'sin-id';
    const reportTypeStr = reportType === 'day' ? 'diario' : 'mensual';
    const fileName = `reporte_${reportTypeStr}_caja_${cajaId}_${timestamp}.xlsx`;

    // Descargar archivo
    XLSX.writeFile(workbook, fileName);
    
    return { success: true, fileName };
  } catch (error) {
    console.error('Error generando reporte:', error);
    throw error;
  }
}
