#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'drfsimplecrud.settings')
django.setup()

from caja.models import Caja
from users.models import User
from decimal import Decimal

print("="*60)
print("ASEGURANDO CAJA ABIERTA")
print("="*60)

# Obtener o crear un usuario admin
try:
    usuario = User.objects.filter(role='admin').first()
    if not usuario:
        usuario = User.objects.filter(is_superuser=True).first()
    if not usuario:
        print("⚠️  No se encontró usuario admin, creando uno...")
        usuario = User.objects.create_user(
            username='admin',
            email='admin@restaurant.com',
            password='admin123',
            role='admin',
            pin='0000'
        )
        print(f"✅ Usuario admin creado: {usuario.username}")
    else:
        print(f"✅ Usuario encontrado: {usuario.username}")
except Exception as e:
    print(f"❌ Error al obtener usuario: {e}")
    exit(1)

# Obtener o crear caja
caja, created = Caja.objects.get_or_create(
    numero_caja='CAJA-001',
    defaults={
        'estado': 'cerrada',
        'saldo_inicial': Decimal('0.00'),
        'saldo_actual': Decimal('0.00'),
        'usuario_apertura': usuario
    }
)

if created:
    print(f"✅ Caja creada: {caja.numero_caja}")
else:
    print(f"✅ Caja existente: {caja.numero_caja}")

# Abrir caja si está cerrada
if caja.estado == 'cerrada':
    caja.estado = 'abierta'
    caja.saldo_inicial = Decimal('1000.00')  # Saldo inicial de 1000
    caja.saldo_actual = Decimal('1000.00')
    caja.usuario_apertura = usuario
    caja.fecha_cierre = None
    caja.save()
    print(f"✅ Caja abierta con saldo inicial de C$1000.00")
else:
    print(f"✅ Caja ya estaba abierta (Saldo actual: C${caja.saldo_actual})")

print(f"\n📊 Estado final:")
print(f"   Caja: {caja.numero_caja}")
print(f"   Estado: {caja.estado}")
print(f"   Saldo inicial: C${caja.saldo_inicial}")
print(f"   Saldo actual: C${caja.saldo_actual}")
print(f"   Usuario: {caja.usuario_apertura.username}")
print(f"\n🎉 ¡Listo! La caja está abierta y lista para procesar pagos")
