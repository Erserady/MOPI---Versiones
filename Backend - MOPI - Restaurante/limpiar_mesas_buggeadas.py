#!/usr/bin/env python
"""
Script para limpiar órdenes problemáticas de mesas específicas

Ejecutar con:
    python limpiar_mesas_buggeadas.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'drfsimplecrud.settings')
django.setup()

from mesero.models import Table, WaiterOrder

print("=" * 70)
print("🧹 LIMPIANDO MESAS PROBLEMÁTICAS")
print("=" * 70)

# Mesas que están buggeadas
MESAS_PROBLEMA = [1, 10, 13]

print(f"\n📋 Buscando órdenes de las mesas: {MESAS_PROBLEMA}")

# Buscar todas las órdenes de esas mesas
ordenes_eliminadas = 0
ordenes_totales = 0

for mesa_num in MESAS_PROBLEMA:
    print(f"\n🔍 Procesando Mesa {mesa_num}...")
    
    # Buscar la mesa
    try:
        # Intentar varios formatos de mesa_id
        mesa_ids = [
            str(mesa_num),
            f"MESA-{mesa_num}",
            f"Mesa {mesa_num}",
            f"{mesa_num}"
        ]
        
        mesa = None
        for mesa_id in mesa_ids:
            try:
                mesa = Table.objects.get(mesa_id=mesa_id)
                break
            except Table.DoesNotExist:
                continue
        
        if not mesa:
            # Intentar por number
            try:
                mesa = Table.objects.get(number=str(mesa_num))
            except Table.DoesNotExist:
                print(f"   ⚠️  Mesa {mesa_num} no encontrada en la base de datos")
                continue
        
        print(f"   ✅ Mesa encontrada: ID={mesa.id}, mesa_id={mesa.mesa_id}, number={mesa.number}")
        
        # Obtener todas las órdenes de esta mesa
        ordenes = WaiterOrder.objects.filter(table=mesa)
        count = ordenes.count()
        ordenes_totales += count
        
        print(f"   📊 Órdenes encontradas: {count}")
        
        if count > 0:
            # Mostrar detalles de las órdenes antes de eliminar
            for orden in ordenes:
                print(f"      - Orden ID: {orden.id}, order_id: {orden.order_id}, estado: {orden.estado}")
            
            # Eliminar todas las órdenes
            ordenes.delete()
            ordenes_eliminadas += count
            print(f"   ✅ {count} órdenes eliminadas")
            
            # Actualizar estado de la mesa
            mesa.status = 'available'
            mesa.assigned_waiter = None
            mesa.save()
            print(f"   ✅ Mesa {mesa_num} marcada como disponible")
        else:
            print(f"   ℹ️  No hay órdenes para esta mesa")
            
    except Exception as e:
        print(f"   ❌ Error procesando Mesa {mesa_num}: {str(e)}")

# Resumen final
print("\n" + "=" * 70)
print("📊 RESUMEN DE LIMPIEZA")
print("=" * 70)
print(f"🗑️  Órdenes eliminadas: {ordenes_eliminadas}")
print(f"📋 Total de órdenes procesadas: {ordenes_totales}")
print(f"✅ Mesas procesadas: {len(MESAS_PROBLEMA)}")
print("=" * 70)

if ordenes_eliminadas > 0:
    print("\n🎉 Limpieza completada exitosamente!")
    print("💡 Las mesas ahora deberían funcionar correctamente.")
else:
    print("\nℹ️  No se encontraron órdenes para eliminar.")
    print("💡 Las mesas ya estaban limpias o no existen en la base de datos.")

print("\n🔄 PRÓXIMOS PASOS:")
print("1. Abre la aplicación en el navegador")
print("2. Recarga la página (F5)")
print("3. Las mesas 1, 10 y 13 deberían aparecer como 'LIBRE'")
print("4. Intenta crear una nueva orden en cualquiera de esas mesas")
