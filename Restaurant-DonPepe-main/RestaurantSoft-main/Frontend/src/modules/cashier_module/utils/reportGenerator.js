import * as XLSX from 'xlsx';

/**
 * Genera un reporte detallado de caja en formato Excel
 * @param {Object} params - Parámetros del reporte
 * @param {Array} params.transactions - Array de transacciones/pagos
 * @param {Array} params.egresos - Array de egresos
 * @param {Object} params.cajaInfo - Información de la caja
 * @param {string} params.reportType - Tipo de reporte ('day' o 'month')
 * @param {string} params.dateInfo - Información de la fecha del reporte
 * @returns {void} - Genera y descarga el archivo Excel
 */
export function generateDetailedCashReport({
  transactions,
  egresos = [],
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
    
    const totalEgresos = egresos.reduce((sum, e) => sum + parseFloat(e.monto || 0), 0);
    const totalVentas = totalEfectivo + totalTarjeta;
    const totalGeneral = totalVentas - totalEgresos;
    const saldoFinal = formatCurrency(cajaInfo?.saldo_inicial || 0) + totalEfectivo - totalEgresos;
    
    // Resumen de totales
    summaryData.push(['RESUMEN FINANCIERO']);
    summaryData.push(['INGRESOS POR VENTAS:']);
    summaryData.push(['  Total Efectivo:', formatCurrency(totalEfectivo)]);
    summaryData.push(['  Total Tarjeta:', formatCurrency(totalTarjeta)]);
    summaryData.push(['  Subtotal Ventas:', formatCurrency(totalVentas)]);
    summaryData.push([]);
    if (totalEgresos > 0) {
      summaryData.push(['EGRESOS:']);
      summaryData.push(['  Total Egresos:', formatCurrency(totalEgresos)]);
      summaryData.push([]);
    }
    summaryData.push(['TOTALES FINALES:']);
    summaryData.push(['  Total Neto:', formatCurrency(totalGeneral)]);
    summaryData.push(['  Saldo Final en Caja (efectivo):', formatCurrency(saldoFinal)]);
    summaryData.push([]);
    
    // Estadísticas adicionales
    summaryData.push(['ESTADÍSTICAS']);
    summaryData.push(['Transacciones en Efectivo:', sortedTransactions.filter(t => t.metodo_pago === 'efectivo').length]);
    summaryData.push(['Transacciones con Tarjeta:', sortedTransactions.filter(t => t.metodo_pago === 'tarjeta').length]);
    summaryData.push(['Ticket Promedio:', formatCurrency(totalGeneral / sortedTransactions.length || 0)]);
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 25 }];
    
    // Aplicar estilos a las celdas del resumen
    const range = XLSX.utils.decode_range(summarySheet['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = { c: C, r: R };
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        if (!summarySheet[cell_ref]) continue;
        
        // Aplicar estilos según el tipo de celda
        if (R === 0) { // Título principal
          summarySheet[cell_ref].s = {
            font: { bold: true, sz: 16, color: { rgb: "1F4E78" } },
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: { fgColor: { rgb: "D6DCE4" } }
          };
        } else if (summaryData[R] && summaryData[R][C]) {
          const cellValue = String(summaryData[R][C] || '');
          if (cellValue.includes('INFORMACIÓN') || 
              cellValue.includes('RESUMEN') || 
              cellValue.includes('ESTADÍSTICAS') ||
              cellValue.includes('TOTALES')) {
            summarySheet[cell_ref].s = {
              font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "4472C4" } },
              alignment: { horizontal: 'left', vertical: 'center' }
            };
          }
        }
      }
    }
    
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    // ===== HOJA 2: TRANSACCIONES DETALLADAS - FORMATO SÁBANA DE DATOS =====
    const transactionHeaders = [
      'No.',
      'Fecha Transacción',
      'Hora Transacción',
      'Día de la Semana',
      'Mesa',
      'Número Factura',
      'Nombre Platillo',
      'Categoría Platillo',
      'Cantidad',
      'Precio Unitario',
      'Subtotal Platillo',
      'Descuento (%)',
      'Comentario/Notas',
      'Método de Pago',
      'Total Factura',
      'Estado Pago',
      'Mesero Asignado',
      'Cajero',
      'Caja ID',
      'Turno'
    ];
    
    const transactionRows = [];
    let rowNumber = 1;
    
    // Mapeo de categorías comunes para clasificar platillos
    const getCategoriaEstimada = (nombrePlato) => {
      const nombre = nombrePlato.toUpperCase();
      if (nombre.includes('CHURRASCO') || nombre.includes('FILETE') || nombre.includes('CARNE') || nombre.includes('LOMO')) return 'CARNES';
      if (nombre.includes('POLLO')) return 'AVES';
      if (nombre.includes('PESCADO') || nombre.includes('CAMARON') || nombre.includes('CORVINA')) return 'MARISCOS';
      if (nombre.includes('COCA') || nombre.includes('REFRESCO') || nombre.includes('JUGO') || nombre.includes('AGUA')) return 'BEBIDAS NO ALCOHÓLICAS';
      if (nombre.includes('CERVEZA') || nombre.includes('RON') || nombre.includes('VINO') || nombre.includes('TEQUILA')) return 'BEBIDAS ALCOHÓLICAS';
      if (nombre.includes('PAPA') || nombre.includes('ARROZ') || nombre.includes('ENSALADA') || nombre.includes('TORTILLA')) return 'EXTRAS';
      if (nombre.includes('SOPA') || nombre.includes('CALDO')) return 'ENTRADAS';
      if (nombre.includes('POSTRE') || nombre.includes('FLAN') || nombre.includes('HELADO')) return 'POSTRES';
      return 'OTROS';
    };
    
    sortedTransactions.forEach((transaction) => {
      const factura = transaction.factura_detalle || transaction.factura;
      const fecha = new Date(transaction.created_at);
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const diaSemana = diasSemana[fecha.getDay()];
      const hora = fecha.getHours();
      const turno = hora < 12 ? 'Mañana' : hora < 18 ? 'Tarde' : 'Noche';
      
      const mesa = factura?.table?.number
        ? `Mesa ${factura.table.number}`
        : factura?.mesa || factura?.mesa_nombre || 'N/D';
      const mesero = factura?.mesero_asignado ||
        factura?.orders?.[0]?.waiter_name ||
        factura?.orders?.[0]?.mesero ||
        transaction.waiter_name || 'Sin asignar';
      
      // Información común de la transacción
      const baseInfo = {
        'No.': rowNumber,
        'Fecha Transacción': fecha.toLocaleDateString('es-NI'),
        'Hora Transacción': fecha.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' }),
        'Día de la Semana': diaSemana,
        'Mesa': mesa,
        'Número Factura': factura?.numero_factura || factura?.id || 'N/D',
        'Método de Pago': transaction.metodo_pago === 'efectivo' ? 'Efectivo' : 'Tarjeta',
        'Total Factura': formatCurrency(transaction.monto),
        'Estado Pago': factura?.estado || 'Pagada',
        'Mesero Asignado': mesero,
        'Cajero': cajeroName,
        'Caja ID': cajaInfo?.numero_caja || cajaInfo?.id || 'N/D',
        'Turno': turno
      };
      
      // Extraer platillos de la factura
      let platillosAgregados = false;
      
      if (factura?.orders && Array.isArray(factura.orders)) {
        factura.orders.forEach(order => {
          // El backend ahora parsea el pedido y lo expone en el campo 'products'
          const productos = order.products || [];
          
          if (productos && Array.isArray(productos) && productos.length > 0) {
            productos.forEach(product => {
              const platilloNombre = product.dishName || product.name || product.plato_nombre || product.platillo || 'Producto sin nombre';
              const cantidad = product.dishQuantity || product.quantity || product.cantidad || 0;
              const precioUnit = product.unitPrice || product.price || product.precio || 0;
              const subtotal = product.subtotal || (cantidad * precioUnit) || 0;
              const comentario = product.description || product.notes || product.comentario || '';
              const categoria = getCategoriaEstimada(platilloNombre);
              
              transactionRows.push({
                ...baseInfo,
                'Nombre Platillo': platilloNombre,
                'Categoría Platillo': categoria,
                'Cantidad': cantidad,
                'Precio Unitario': formatCurrency(precioUnit),
                'Subtotal Platillo': formatCurrency(subtotal),
                'Descuento (%)': 0,
                'Comentario/Notas': comentario
              });
              
              platillosAgregados = true;
            });
          }
        });
      }
      
      // Si no hay platillos, agregar una fila con la info de la transacción
      if (!platillosAgregados) {
        transactionRows.push({
          ...baseInfo,
          'Nombre Platillo': 'Sin detalle de platillos',
          'Categoría Platillo': 'N/A',
          'Cantidad': 0,
          'Precio Unitario': formatCurrency(0),
          'Subtotal Platillo': formatCurrency(0),
          'Descuento (%)': 0,
          'Comentario/Notas': ''
        });
      }
      
      rowNumber++;
    });
    
    const transactionSheet = XLSX.utils.json_to_sheet(transactionRows, { header: transactionHeaders });
    transactionSheet['!cols'] = [
      { wch: 6 },  // No.
      { wch: 15 }, // Fecha Transacción
      { wch: 12 }, // Hora Transacción
      { wch: 12 }, // Día de la Semana
      { wch: 12 }, // Mesa
      { wch: 16 }, // Número Factura
      { wch: 35 }, // Nombre Platillo
      { wch: 22 }, // Categoría Platillo
      { wch: 10 }, // Cantidad
      { wch: 14 }, // Precio Unitario
      { wch: 16 }, // Subtotal Platillo
      { wch: 12 }, // Descuento (%)
      { wch: 35 }, // Comentario/Notas
      { wch: 16 }, // Método de Pago
      { wch: 14 }, // Total Factura
      { wch: 14 }, // Estado Pago
      { wch: 20 }, // Mesero Asignado
      { wch: 18 }, // Cajero
      { wch: 10 }, // Caja ID
      { wch: 10 }  // Turno
    ];
    
    // Aplicar formato de tabla con filtros automáticos
    if (transactionRows.length > 0) {
      const transRange = XLSX.utils.decode_range(transactionSheet['!ref']);
      transactionSheet['!autofilter'] = { ref: XLSX.utils.encode_range(transRange) };
      
      // Estilo para encabezados
      for (let C = transRange.s.c; C <= transRange.e.c; ++C) {
        const cell_ref = XLSX.utils.encode_cell({ c: C, r: 0 });
        if (!transactionSheet[cell_ref]) continue;
        transactionSheet[cell_ref].s = {
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
          fill: { fgColor: { rgb: "4472C4" } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          }
        };
      }
      
      // Estilo para filas de datos (alternadas)
      for (let R = 1; R <= transRange.e.r; ++R) {
        for (let C = transRange.s.c; C <= transRange.e.c; ++C) {
          const cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
          if (!transactionSheet[cell_ref]) continue;
          
          transactionSheet[cell_ref].s = {
            fill: { fgColor: { rgb: R % 2 === 0 ? "FFFFFF" : "F2F2F2" } },
            border: {
              top: { style: 'thin', color: { rgb: "D3D3D3" } },
              bottom: { style: 'thin', color: { rgb: "D3D3D3" } },
              left: { style: 'thin', color: { rgb: "D3D3D3" } },
              right: { style: 'thin', color: { rgb: "D3D3D3" } }
            },
            alignment: { vertical: 'center' }
          };
        }
      }
    }
    
    XLSX.utils.book_append_sheet(workbook, transactionSheet, 'Transacciones');

    // ===== HOJA 3: DETALLE DE PLATILLOS VENDIDOS =====
    // Extraer todos los productos de todas las transacciones
    const productosMap = new Map();
    
    sortedTransactions.forEach(transaction => {
      const factura = transaction.factura_detalle || transaction.factura;
      if (factura?.orders && Array.isArray(factura.orders)) {
        factura.orders.forEach(order => {
          // El backend ahora parsea el pedido y lo expone en el campo 'products'
          const productos = order.products || [];
          
          if (productos && Array.isArray(productos) && productos.length > 0) {
            productos.forEach(product => {
              const productName = product.dishName || product.name || product.plato_nombre || product.platillo || 'Producto sin nombre';
              const quantity = product.dishQuantity || product.quantity || product.cantidad || 0;
              const price = product.unitPrice || product.price || product.precio || 0;
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
    
    // Crear hoja de detalle de platillos
    const detallePlatillosData = [
      ['CAFÉ-RESTAURANTE DON PEPE'],
      ['DETALLE DE PLATILLOS VENDIDOS ' + dateInfo.toUpperCase()],
      []
    ];
    
    if (productosMap.size > 0) {
      // Ordenar productos por total vendido (mayor a menor)
      const productosOrdenados = Array.from(productosMap.values())
        .sort((a, b) => b.total - a.total);
      
      let totalCantidad = 0;
      let totalVendido = 0;
      
      productosOrdenados.forEach(producto => {
        detallePlatillosData.push([
          producto.nombre.toUpperCase(),
          producto.cantidad,
          '$',
          formatCurrency(producto.total)
        ]);
        totalCantidad += producto.cantidad;
        totalVendido += producto.total;
      });
      
      // Agregar total
      detallePlatillosData.push([]);
      detallePlatillosData.push([
        'Total general',
        totalCantidad,
        '$',
        formatCurrency(totalVendido)
      ]);
      
      const detallePlatillosSheet = XLSX.utils.aoa_to_sheet(detallePlatillosData);
      detallePlatillosSheet['!cols'] = [
        { wch: 40 }, // Platillo
        { wch: 12 }, // Cantidad
        { wch: 3 },  // $
        { wch: 15 }  // Total
      ];
      
      // Aplicar estilos a la hoja de platillos
      const platillosRange = XLSX.utils.decode_range(detallePlatillosSheet['!ref']);
      
      // Título principal (fila 0)
      const titleCell = XLSX.utils.encode_cell({ c: 0, r: 0 });
      if (detallePlatillosSheet[titleCell]) {
        detallePlatillosSheet[titleCell].s = {
          font: { bold: true, sz: 14, color: { rgb: "1F4E78" } },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: "D6DCE4" } }
        };
      }
      
      // Subtítulo (fila 1)
      const subtitleCell = XLSX.utils.encode_cell({ c: 0, r: 1 });
      if (detallePlatillosSheet[subtitleCell]) {
        detallePlatillosSheet[subtitleCell].s = {
          font: { bold: true, sz: 11, color: { rgb: "4472C4" } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
      
      // Estilo para filas de datos (productos)
      for (let R = 3; R < platillosRange.e.r; ++R) {
        for (let C = platillosRange.s.c; C <= platillosRange.e.c; ++C) {
          const cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
          if (!detallePlatillosSheet[cell_ref]) continue;
          
          const cellValue = detallePlatillosSheet[cell_ref].v;
          const cellStr = cellValue ? String(cellValue).toLowerCase() : '';
          
          // Estilo especial para la fila de total
          if (cellStr && cellStr.includes('total')) {
            detallePlatillosSheet[cell_ref].s = {
              font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "4472C4" } },
              alignment: { horizontal: 'left', vertical: 'center' },
              border: {
                top: { style: 'medium', color: { rgb: "000000" } },
                bottom: { style: 'medium', color: { rgb: "000000" } }
              }
            };
          } else {
            // Filas normales alternadas
            detallePlatillosSheet[cell_ref].s = {
              fill: { fgColor: { rgb: (R - 3) % 2 === 0 ? "FFFFFF" : "F2F2F2" } },
              border: {
                top: { style: 'thin', color: { rgb: "D3D3D3" } },
                bottom: { style: 'thin', color: { rgb: "D3D3D3" } }
              },
              alignment: { 
                horizontal: C === 1 || C === 3 ? 'right' : 'left',
                vertical: 'center' 
              }
            };
            
            // Negrita para nombres de platillos
            if (C === 0) {
              detallePlatillosSheet[cell_ref].s.font = { bold: true };
            }
          }
        }
      }
      
      XLSX.utils.book_append_sheet(workbook, detallePlatillosSheet, 'Detalle de Platillos');
    }

    // ===== HOJA 4: EGRESOS =====
    if (egresos.length > 0) {
      const egresosData = [
        ['DETALLE DE EGRESOS ' + dateInfo.toUpperCase()],
        [],
        ['Fecha', 'Hora', 'Concepto', 'Monto', 'Responsable']
      ];
      
      egresos.forEach(egreso => {
        const fecha = new Date(egreso.created_at);
        egresosData.push([
          fecha.toLocaleDateString('es-NI'),
          fecha.toLocaleTimeString('es-NI'),
          egreso.comentario || 'Sin descripción',
          formatCurrency(egreso.monto),
          cajeroName
        ]);
      });
      
      egresosData.push([]);
      egresosData.push([
        '',
        '',
        'TOTAL EGRESOS:',
        formatCurrency(totalEgresos),
        ''
      ]);
      
      const egresosSheet = XLSX.utils.aoa_to_sheet(egresosData);
      egresosSheet['!cols'] = [
        { wch: 12 }, // Fecha
        { wch: 12 }, // Hora
        { wch: 40 }, // Concepto
        { wch: 15 }, // Monto
        { wch: 20 }  // Responsable
      ];
      
      // Aplicar estilos a la hoja de egresos
      const egresosRange = XLSX.utils.decode_range(egresosSheet['!ref']);
      
      // Título (fila 0)
      const egresosTitleCell = XLSX.utils.encode_cell({ c: 0, r: 0 });
      if (egresosSheet[egresosTitleCell]) {
        egresosSheet[egresosTitleCell].s = {
          font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "C00000" } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
      
      // Encabezados (fila 2)
      for (let C = egresosRange.s.c; C <= egresosRange.e.c; ++C) {
        const cell_ref = XLSX.utils.encode_cell({ c: C, r: 2 });
        if (!egresosSheet[cell_ref]) continue;
        egresosSheet[cell_ref].s = {
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
          fill: { fgColor: { rgb: "C00000" } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } }
          }
        };
      }
      
      // Filas de datos y total
      for (let R = 3; R <= egresosRange.e.r; ++R) {
        for (let C = egresosRange.s.c; C <= egresosRange.e.c; ++C) {
          const cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
          if (!egresosSheet[cell_ref]) continue;
          
          const cellValue = egresosSheet[cell_ref].v;
          const cellStr = cellValue ? String(cellValue) : '';
          
          // Fila de total
          if (cellStr && cellStr.includes('TOTAL')) {
            egresosSheet[cell_ref].s = {
              font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "C00000" } },
              alignment: { horizontal: 'right', vertical: 'center' },
              border: {
                top: { style: 'medium', color: { rgb: "000000" } },
                bottom: { style: 'medium', color: { rgb: "000000" } }
              }
            };
          } else if (R > 2 && !cellValue) {
            // Celdas vacías en fila de total
            egresosSheet[cell_ref].s = {
              fill: { fgColor: { rgb: "C00000" } },
              border: {
                top: { style: 'medium', color: { rgb: "000000" } },
                bottom: { style: 'medium', color: { rgb: "000000" } }
              }
            };
          } else {
            // Filas de datos normales
            egresosSheet[cell_ref].s = {
              fill: { fgColor: { rgb: (R - 3) % 2 === 0 ? "FFF2F2" : "FFE6E6" } },
              border: {
                top: { style: 'thin', color: { rgb: "D3D3D3" } },
                bottom: { style: 'thin', color: { rgb: "D3D3D3" } }
              },
              alignment: { vertical: 'center' }
            };
          }
        }
      }
      
      // Aplicar filtros automáticos
      egresosSheet['!autofilter'] = { ref: XLSX.utils.encode_range({
        s: { c: egresosRange.s.c, r: 2 },
        e: { c: egresosRange.e.c, r: egresosRange.e.r - 2 }
      })};
      
      XLSX.utils.book_append_sheet(workbook, egresosSheet, 'Egresos');
    }

    // ===== HOJA 5: RESUMEN POR MÉTODO DE PAGO =====
    const paymentMethodData = [
      ['RESUMEN POR MÉTODO DE PAGO'],
      [],
      ['Método de Pago', 'Cantidad de Transacciones', 'Monto Total'],
      ['Efectivo', sortedTransactions.filter(t => t.metodo_pago === 'efectivo').length, formatCurrency(totalEfectivo)],
      ['Tarjeta', sortedTransactions.filter(t => t.metodo_pago === 'tarjeta').length, formatCurrency(totalTarjeta)],
      [],
      ['SUBTOTAL VENTAS', sortedTransactions.length, formatCurrency(totalVentas)]
    ];
    
    if (totalEgresos > 0) {
      paymentMethodData.push([]);
      paymentMethodData.push(['Egresos', egresos.length, formatCurrency(totalEgresos)]);
      paymentMethodData.push([]);
      paymentMethodData.push(['TOTAL NETO', sortedTransactions.length + egresos.length, formatCurrency(totalGeneral)]);
    }
    
    const paymentMethodSheet = XLSX.utils.aoa_to_sheet(paymentMethodData);
    paymentMethodSheet['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 20 }];
    
    // Aplicar estilos a resumen por método de pago
    const paymentRange = XLSX.utils.decode_range(paymentMethodSheet['!ref']);
    
    for (let R = paymentRange.s.r; R <= paymentRange.e.r; ++R) {
      for (let C = paymentRange.s.c; C <= paymentRange.e.c; ++C) {
        const cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
        if (!paymentMethodSheet[cell_ref]) continue;
        
        const cellValue = paymentMethodSheet[cell_ref].v;
        const cellStr = cellValue ? String(cellValue) : '';
        
        // Título principal
        if (R === 0) {
          paymentMethodSheet[cell_ref].s = {
            font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: 'center', vertical: 'center' }
          };
        }
        // Encabezados de columnas
        else if (R === 2) {
          paymentMethodSheet[cell_ref].s = {
            font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "5B9BD5" } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: "000000" } },
              bottom: { style: 'thin', color: { rgb: "000000" } }
            }
          };
        }
        // Filas de totales
        else if (cellStr && (cellStr.includes('TOTAL') || cellStr.includes('SUBTOTAL'))) {
          paymentMethodSheet[cell_ref].s = {
            font: { bold: true, sz: 11 },
            fill: { fgColor: { rgb: cellStr.includes('NETO') ? "70AD47" : "BDD7EE" } },
            alignment: { horizontal: 'left', vertical: 'center' },
            border: {
              top: { style: 'medium', color: { rgb: "000000" } },
              bottom: { style: 'medium', color: { rgb: "000000" } }
            }
          };
        }
        // Filas normales
        else if (R > 2) {
          paymentMethodSheet[cell_ref].s = {
            fill: { fgColor: { rgb: "E7E6E6" } },
            alignment: { horizontal: C === 0 ? 'left' : 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: "D3D3D3" } },
              bottom: { style: 'thin', color: { rgb: "D3D3D3" } }
            }
          };
        }
      }
    }
    
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
