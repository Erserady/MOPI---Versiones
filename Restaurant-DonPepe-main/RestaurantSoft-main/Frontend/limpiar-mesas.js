/**
 * Script temporal para limpiar órdenes problemáticas de mesas específicas
 * 
 * INSTRUCCIONES DE USO:
 * 1. Abre la aplicación en el navegador
 * 2. Inicia sesión con cualquier usuario
 * 3. Presiona F12 para abrir la consola del navegador
 * 4. Copia y pega todo este código en la consola
 * 5. El script automáticamente eliminará las órdenes de las mesas 1, 10 y 13
 */

(async function limpiarMesasProblematicas() {
  console.log("🧹 Iniciando limpieza de mesas problemáticas...");
  
  const API_BASE_URL = "https://mopi.fly.dev"; // URL del backend
  const mesasALimpiar = [1, 10, 13]; // Mesas que queremos limpiar
  
  // Obtener token de sesión
  const token = sessionStorage.getItem("authToken");
  if (!token) {
    console.error("❌ No hay token de sesión. Por favor inicia sesión primero.");
    return;
  }
  
  try {
    // 1. Obtener todas las órdenes
    console.log("📋 Obteniendo todas las órdenes...");
    const response = await fetch(`${API_BASE_URL}/api/mesero/mesero-orders/`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error al obtener órdenes: ${response.status}`);
    }
    
    const ordenes = await response.json();
    console.log(`📊 Total de órdenes encontradas: ${ordenes.length}`);
    
    // 2. Filtrar órdenes de las mesas problemáticas
    const ordenesAEliminar = ordenes.filter(orden => {
      const mesaId = orden.mesa_id || orden.table || orden.mesa;
      const mesaIdNum = typeof mesaId === 'string' ? parseInt(mesaId) : mesaId;
      return mesasALimpiar.includes(mesaIdNum);
    });
    
    console.log(`🎯 Órdenes encontradas para limpiar:`, ordenesAEliminar);
    
    if (ordenesAEliminar.length === 0) {
      console.log("✅ No se encontraron órdenes problemáticas. Las mesas ya están limpias.");
      return;
    }
    
    // 3. Eliminar cada orden
    let eliminadas = 0;
    let errores = 0;
    
    for (const orden of ordenesAEliminar) {
      try {
        console.log(`🗑️ Eliminando orden ID ${orden.id} de mesa ${orden.mesa_id}...`);
        
        const deleteResponse = await fetch(`${API_BASE_URL}/api/mesero/mesero-orders/${orden.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (deleteResponse.ok) {
          console.log(`✅ Orden ${orden.id} eliminada exitosamente`);
          eliminadas++;
        } else {
          console.error(`❌ Error al eliminar orden ${orden.id}: ${deleteResponse.status}`);
          errores++;
        }
      } catch (error) {
        console.error(`❌ Error al eliminar orden ${orden.id}:`, error);
        errores++;
      }
    }
    
    // 4. Resumen
    console.log("\n" + "=".repeat(50));
    console.log("📊 RESUMEN DE LIMPIEZA");
    console.log("=".repeat(50));
    console.log(`✅ Órdenes eliminadas: ${eliminadas}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📋 Total procesadas: ${ordenesAEliminar.length}`);
    console.log("=".repeat(50));
    
    if (eliminadas > 0) {
      console.log("\n🎉 Limpieza completada. Recarga la página (F5) para ver los cambios.");
    }
    
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
  }
})();
