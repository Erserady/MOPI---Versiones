"""
Script de prueba para verificar el endpoint del menú
Ejecutar desde la carpeta Backend
"""
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'drfsimplecrud.settings')
django.setup()

from administrador.models import CategoriaMenu, Plato
from administrador.serializers import CategoriaMenuSerializer, PlatoSerializer

print("=" * 60)
print("🔍 VERIFICACIÓN DEL MENÚ EN LA BASE DE DATOS")
print("=" * 60)

# Verificar categorías
print("\n📋 CATEGORÍAS:")
categorias = CategoriaMenu.objects.filter(activa=True)
print(f"   Total: {categorias.count()}")
for cat in categorias:
    print(f"   - {cat.nombre} (Orden: {cat.orden})")

# Verificar platos por categoría
print("\n🍽️ PLATOS POR CATEGORÍA:")
for categoria in categorias:
    platos = categoria.platos.filter(disponible=True)
    print(f"\n   {categoria.nombre}: {platos.count()} platos")
    for plato in platos[:3]:  # Mostrar solo los primeros 3
        print(f"      - {plato.nombre}: ${plato.precio}")
    if platos.count() > 3:
        print(f"      ... y {platos.count() - 3} más")

# Simular la respuesta del endpoint
print("\n" + "=" * 60)
print("📦 SIMULANDO RESPUESTA DEL ENDPOINT menu_completo")
print("=" * 60)

categorias = CategoriaMenu.objects.filter(activa=True).prefetch_related('platos')
data = []

for categoria in categorias:
    platos_disponibles = categoria.platos.filter(disponible=True)
    cat_data = {
        'categoria': CategoriaMenuSerializer(categoria).data,
        'platos': PlatoSerializer(platos_disponibles, many=True).data
    }
    data.append(cat_data)

print(f"\n✅ Total de categorías en respuesta: {len(data)}")
total_platos = sum(len(cat['platos']) for cat in data)
print(f"✅ Total de platos en respuesta: {total_platos}")

# Verificar tamaño de la respuesta
import json
json_data = json.dumps(data, default=str)
size_kb = len(json_data) / 1024
print(f"✅ Tamaño de la respuesta: {size_kb:.2f} KB")

if size_kb > 1024:
    print("⚠️ ADVERTENCIA: Respuesta muy grande (>1MB)")
elif size_kb > 512:
    print("⚠️ ADVERTENCIA: Respuesta grande (>512KB)")
else:
    print("✅ Tamaño de respuesta aceptable")

print("\n" + "=" * 60)
print("🔍 ESTRUCTURA DE EJEMPLO (Primera categoría):")
print("=" * 60)
if data:
    ejemplo = data[0]
    print(f"\nCategoría: {ejemplo['categoria']['nombre']}")
    print(f"Platos: {len(ejemplo['platos'])}")
    if ejemplo['platos']:
        print(f"\nPrimer plato:")
        primer_plato = ejemplo['platos'][0]
        for key, value in primer_plato.items():
            if key != 'descripcion' and key != 'ingredientes':
                print(f"   {key}: {value}")

print("\n" + "=" * 60)
print("✅ VERIFICACIÓN COMPLETADA")
print("=" * 60)
