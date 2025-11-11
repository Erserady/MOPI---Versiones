#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'drfsimplecrud.settings')
django.setup()

from mesero.models import Table

print("="*60)
print("ACTUALIZANDO TODAS LAS MESAS")
print("="*60)

# Actualizar TODAS las mesas existentes
mesas_actualizadas = 0
for mesa in Table.objects.all():
    cambios = False
    
    # Asegurar que tenga 'number'
    if not mesa.number:
        mesa.number = mesa.mesa or mesa.mesa_id
        cambios = True
    
    # Asegurar que tenga 'capacity'
    if not mesa.capacity or mesa.capacity == 0:
        mesa.capacity = 4
        cambios = True
    
    # Asegurar que tenga 'status'
    if not mesa.status:
        mesa.status = 'available'
        cambios = True
    
    if cambios:
        mesa.save()
        mesas_actualizadas += 1
        print(f"✅ Mesa actualizada: ID={mesa.id}, number={mesa.number}, capacity={mesa.capacity}")

print(f"\n{'='*60}")
print(f"✅ Mesas actualizadas: {mesas_actualizadas}")
print(f"📊 Total mesas en sistema: {Table.objects.count()}")
print(f"{'='*60}")

# Verificar que todas tengan los campos
sin_number = Table.objects.filter(number__isnull=True).count()
sin_capacity = Table.objects.filter(capacity__isnull=True).count()
sin_status = Table.objects.filter(status__isnull=True).count()

print(f"\n📋 Verificación:")
print(f"   Mesas sin 'number': {sin_number}")
print(f"   Mesas sin 'capacity': {sin_capacity}")
print(f"   Mesas sin 'status': {sin_status}")

if sin_number == 0 and sin_capacity == 0 and sin_status == 0:
    print(f"\n🎉 ¡Perfecto! Todas las mesas están actualizadas")
else:
    print(f"\n⚠️ Aún hay mesas sin actualizar")

print(f"\n📋 Listado de todas las mesas:")
for m in Table.objects.all():
    print(f"   ID={m.id:3d} | number={str(m.number):15s} | capacity={m.capacity:2d} | status={m.status:10s}")
