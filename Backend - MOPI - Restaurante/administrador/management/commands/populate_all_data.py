from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from administrador.models import CategoriaMenu, Plato, Inventario, ConfiguracionSistema
from mesero.models import Table, WaiterOrder
from cocina.models import Order
from caja.models import Caja, Factura
from decimal import Decimal
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Popula la base de datos con datos de ejemplo para todas las vistas'

    def handle(self, *args, **kwargs):
        self.stdout.write("🚀 Iniciando población de datos de ejemplo...")
        
        # Obtener usuarios existentes
        try:
            admin_user = User.objects.filter(role='admin').first()
            if not admin_user:
                self.stdout.write(self.style.ERROR('⚠️ No se encontró usuario administrador. Ejecuta primero: python manage.py populate_users'))
                return
        except:
            self.stdout.write(self.style.ERROR('⚠️ Error al obtener usuarios. Ejecuta primero: python manage.py populate_users'))
            return
        
        # 1. Crear configuración del sistema
        self.stdout.write("\n📝 Creando configuración del sistema...")
        config, created = ConfiguracionSistema.objects.get_or_create(
            pk=1,
            defaults={
                'nombre_restaurante': 'Restaurante Don Pepe',
                'impuesto': Decimal('0.18'),
                'porcentaje_propina': Decimal('0.10'),
                'telefono': '555-1234',
                'direccion': 'Calle Principal #123, Ciudad',
                'horario_apertura': '08:00:00',
                'horario_cierre': '22:00:00'
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('✅ Configuración creada'))
        else:
            self.stdout.write(self.style.WARNING('⚠️ Configuración ya existía'))
        
        # 2. Crear categorías de menú
        self.stdout.write("\n🍽️ Creando categorías de menú...")
        categorias_data = [
            {'nombre': 'CARNE ROJA', 'descripcion': 'Platos de carne de res', 'orden': 1},
            {'nombre': 'CARNE BLANCA', 'descripcion': 'Platos de pollo y aves', 'orden': 2},
            {'nombre': 'CARNE DE CERDO', 'descripcion': 'Platos de cerdo', 'orden': 3},
            {'nombre': 'MARISCOS', 'descripcion': 'Platos del mar', 'orden': 4},
            {'nombre': 'VARIADOS', 'descripcion': 'Entradas y antojitos', 'orden': 5},
            {'nombre': 'CERVEZAS', 'descripcion': 'Bebidas alcohólicas', 'orden': 6},
            {'nombre': 'ENLATADOS', 'descripcion': 'Productos enlatados', 'orden': 7},
        ]
        
        categorias = {}
        for cat_data in categorias_data:
            cat, created = CategoriaMenu.objects.get_or_create(
                nombre=cat_data['nombre'],
                defaults={
                    'descripcion': cat_data['descripcion'],
                    'orden': cat_data['orden'],
                    'activa': True
                }
            )
            categorias[cat_data['nombre']] = cat
            if created:
                self.stdout.write(f'  ✅ {cat.nombre}')
        
        # 3. Crear platos
        self.stdout.write("\n🍴 Creando platos...")
        platos_data = [
            # Carnes Rojas
            {'nombre': 'Lomo a la parrilla', 'categoria': 'CARNE ROJA', 'precio': 15.99, 'ingredientes': 'Lomo de res, especias, sal, pimienta', 'tiempo_preparacion': 20},
            {'nombre': 'Bistec encebollado', 'categoria': 'CARNE ROJA', 'precio': 13.50, 'ingredientes': 'Bistec de res, cebolla, sal, pimienta', 'tiempo_preparacion': 18},
            {'nombre': 'T-Bone steak', 'categoria': 'CARNE ROJA', 'precio': 18.99, 'ingredientes': 'T-Bone, mantequilla, ajo, romero', 'tiempo_preparacion': 25},
            {'nombre': 'Carne asada', 'categoria': 'CARNE ROJA', 'precio': 14.50, 'ingredientes': 'Falda de res, chimichurri, limón', 'tiempo_preparacion': 22},
            
            # Carnes Blancas
            {'nombre': 'Pechuga a la plancha', 'categoria': 'CARNE BLANCA', 'precio': 11.00, 'ingredientes': 'Pechuga de pollo, limón, especias', 'tiempo_preparacion': 15},
            {'nombre': 'Pollo frito', 'categoria': 'CARNE BLANCA', 'precio': 10.50, 'ingredientes': 'Pollo, harina, especias secretas', 'tiempo_preparacion': 20},
            {'nombre': 'Alitas BBQ', 'categoria': 'CARNE BLANCA', 'precio': 12.00, 'ingredientes': 'Alitas de pollo, salsa BBQ, miel', 'tiempo_preparacion': 18},
            {'nombre': 'Pollo al horno', 'categoria': 'CARNE BLANCA', 'precio': 11.50, 'ingredientes': 'Pollo entero, hierbas, papas', 'tiempo_preparacion': 35},
            
            # Carne de Cerdo
            {'nombre': 'Chuleta de cerdo', 'categoria': 'CARNE DE CERDO', 'precio': 12.00, 'ingredientes': 'Chuleta de cerdo, sal, pimienta', 'tiempo_preparacion': 18},
            {'nombre': 'Costilla BBQ', 'categoria': 'CARNE DE CERDO', 'precio': 13.99, 'ingredientes': 'Costilla de cerdo, salsa BBQ', 'tiempo_preparacion': 30},
            {'nombre': 'Lomo de cerdo', 'categoria': 'CARNE DE CERDO', 'precio': 14.50, 'ingredientes': 'Lomo de cerdo, salsa de frutas', 'tiempo_preparacion': 25},
            
            # Mariscos
            {'nombre': 'Camarones al ajillo', 'categoria': 'MARISCOS', 'precio': 16.50, 'ingredientes': 'Camarones, ajo, mantequilla, perejil', 'tiempo_preparacion': 12},
            {'nombre': 'Filete de pescado', 'categoria': 'MARISCOS', 'precio': 14.00, 'ingredientes': 'Filete de pescado blanco, limón', 'tiempo_preparacion': 15},
            {'nombre': 'Ceviche mixto', 'categoria': 'MARISCOS', 'precio': 15.50, 'ingredientes': 'Pescado, camarón, limón, cebolla', 'tiempo_preparacion': 10},
            {'nombre': 'Pulpo a la gallega', 'categoria': 'MARISCOS', 'precio': 17.99, 'ingredientes': 'Pulpo, paprika, aceite de oliva', 'tiempo_preparacion': 20},
            
            # Variados
            {'nombre': 'Nachos mixtos', 'categoria': 'VARIADOS', 'precio': 7.50, 'ingredientes': 'Nachos, queso, jalapeños, guacamole', 'tiempo_preparacion': 8},
            {'nombre': 'Quesadillas', 'categoria': 'VARIADOS', 'precio': 6.00, 'ingredientes': 'Tortilla, queso, pollo', 'tiempo_preparacion': 10},
            {'nombre': 'Papas fritas', 'categoria': 'VARIADOS', 'precio': 4.50, 'ingredientes': 'Papas, sal', 'tiempo_preparacion': 10},
            {'nombre': 'Aros de cebolla', 'categoria': 'VARIADOS', 'precio': 5.00, 'ingredientes': 'Cebolla, harina, especias', 'tiempo_preparacion': 12},
            
            # Cervezas
            {'nombre': 'Cerveza nacional', 'categoria': 'CERVEZAS', 'precio': 2.00, 'ingredientes': 'Cerveza lager', 'tiempo_preparacion': 1},
            {'nombre': 'Cerveza importada', 'categoria': 'CERVEZAS', 'precio': 3.00, 'ingredientes': 'Cerveza premium', 'tiempo_preparacion': 1},
            {'nombre': 'Cerveza artesanal', 'categoria': 'CERVEZAS', 'precio': 4.50, 'ingredientes': 'Cerveza artesanal IPA', 'tiempo_preparacion': 1},
            
            # Enlatados
            {'nombre': 'Atún enlatado', 'categoria': 'ENLATADOS', 'precio': 2.50, 'ingredientes': 'Atún en agua', 'tiempo_preparacion': 1},
            {'nombre': 'Sardinas', 'categoria': 'ENLATADOS', 'precio': 2.20, 'ingredientes': 'Sardinas en aceite', 'tiempo_preparacion': 1},
        ]
        
        platos_creados = []
        for plato_data in platos_data:
            cat_nombre = plato_data.pop('categoria')
            plato, created = Plato.objects.get_or_create(
                categoria=categorias[cat_nombre],
                nombre=plato_data['nombre'],
                defaults={
                    'descripcion': f"Delicioso {plato_data['nombre']}",
                    'precio': Decimal(str(plato_data['precio'])),
                    'ingredientes': plato_data['ingredientes'],
                    'tiempo_preparacion': plato_data['tiempo_preparacion'],
                    'disponible': True,
                    'orden': len(platos_creados) + 1
                }
            )
            platos_creados.append(plato)
            if created:
                self.stdout.write(f'  ✅ {plato.nombre} - ${plato.precio}')
        
        # 4. Crear inventario
        self.stdout.write("\n📦 Creando inventario...")
        inventario_data = [
            {'nombre': 'Carne de res', 'categoria': 'Carnes', 'cantidad': 50.0, 'unidad': 'kg', 'minimo': 10.0, 'costo': 8.50},
            {'nombre': 'Pollo entero', 'categoria': 'Carnes', 'cantidad': 30.0, 'unidad': 'kg', 'minimo': 8.0, 'costo': 4.50},
            {'nombre': 'Cerdo', 'categoria': 'Carnes', 'cantidad': 25.0, 'unidad': 'kg', 'minimo': 5.0, 'costo': 6.00},
            {'nombre': 'Camarones', 'categoria': 'Mariscos', 'cantidad': 15.0, 'unidad': 'kg', 'minimo': 3.0, 'costo': 12.00},
            {'nombre': 'Pescado blanco', 'categoria': 'Mariscos', 'cantidad': 20.0, 'unidad': 'kg', 'minimo': 5.0, 'costo': 8.00},
            {'nombre': 'Papas', 'categoria': 'Verduras', 'cantidad': 100.0, 'unidad': 'kg', 'minimo': 20.0, 'costo': 1.50},
            {'nombre': 'Cebollas', 'categoria': 'Verduras', 'cantidad': 40.0, 'unidad': 'kg', 'minimo': 10.0, 'costo': 1.00},
            {'nombre': 'Tomates', 'categoria': 'Verduras', 'cantidad': 35.0, 'unidad': 'kg', 'minimo': 8.0, 'costo': 1.20},
            {'nombre': 'Lechuga', 'categoria': 'Verduras', 'cantidad': 25.0, 'unidad': 'unidad', 'minimo': 5.0, 'costo': 0.80},
            {'nombre': 'Aceite vegetal', 'categoria': 'Despensa', 'cantidad': 20.0, 'unidad': 'lt', 'minimo': 5.0, 'costo': 3.50},
            {'nombre': 'Sal', 'categoria': 'Despensa', 'cantidad': 10.0, 'unidad': 'kg', 'minimo': 2.0, 'costo': 0.50},
            {'nombre': 'Harina', 'categoria': 'Despensa', 'cantidad': 30.0, 'unidad': 'kg', 'minimo': 10.0, 'costo': 1.80},
            {'nombre': 'Cerveza nacional', 'categoria': 'Bebidas', 'cantidad': 200.0, 'unidad': 'unidad', 'minimo': 50.0, 'costo': 1.00},
            {'nombre': 'Cerveza importada', 'categoria': 'Bebidas', 'cantidad': 100.0, 'unidad': 'unidad', 'minimo': 25.0, 'costo': 1.80},
        ]
        
        for inv_data in inventario_data:
            inv, created = Inventario.objects.get_or_create(
                nombre=inv_data['nombre'],
                defaults={
                    'categoria': inv_data['categoria'],
                    'cantidad_actual': Decimal(str(inv_data['cantidad'])),
                    'unidad': inv_data['unidad'],
                    'cantidad_minima': Decimal(str(inv_data['minimo'])),
                    'costo_unitario': Decimal(str(inv_data['costo'])),
                    'proveedor': 'Proveedor General',
                    'ubicacion': 'Almacén principal',
                    'activo': True
                }
            )
            if created:
                self.stdout.write(f'  ✅ {inv.nombre} - {inv.cantidad_actual} {inv.unidad}')
        
        # 5. Crear mesas
        self.stdout.write("\n🪑 Creando mesas...")
        mesas_data = []
        for i in range(1, 21):  # 20 mesas
            mesa_id = f"MESA-{i:02d}"
            ubicacion = "Terraza" if i > 15 else ("Ventana" if i > 10 else "Interior")
            mesas_data.append({
                'mesa_id': mesa_id,
                'mesa': f"Mesa {i}",
                'ubicacion': ubicacion
            })
        
        mesas_obj = []
        for mesa_data in mesas_data:
            mesa, created = Table.objects.get_or_create(
                mesa_id=mesa_data['mesa_id'],
                defaults={
                    'mesa': mesa_data['mesa'],
                    'ubicacion': mesa_data['ubicacion']
                }
            )
            mesas_obj.append(mesa)
            if created:
                self.stdout.write(f'  ✅ {mesa.mesa_id} - {mesa.ubicacion}')
        
        # 6. Crear órdenes de ejemplo para mesero y cocina
        self.stdout.write("\n📝 Creando órdenes de ejemplo...")
        estados_orden = ['pendiente', 'en_preparacion', 'listo']
        estados_waiter = ['pendiente', 'servido']
        
        # Obtener meseros
        meseros = list(User.objects.filter(role='waiter'))
        
        if platos_creados and mesas_obj:
            # Crear 15 órdenes de ejemplo
            for i in range(1, 16):
                mesa = random.choice(mesas_obj)
                plato = random.choice(platos_creados)
                cantidad = random.randint(1, 4)
                
                order_id = f"ORD-{i:04d}"
                
                # Orden de mesero
                waiter_order, created = WaiterOrder.objects.get_or_create(
                    order_id=order_id,
                    defaults={
                        'table': mesa,
                        'pedido': f"{cantidad}x {plato.nombre}",
                        'cliente': f"Cliente {i}",
                        'cantidad': cantidad,
                        'nota': 'Sin cebolla' if i % 3 == 0 else '',
                        'preparacion_enlazada': f"COCINA-{i:04d}",
                        'estado': random.choice(estados_waiter)
                    }
                )
                
                # Orden de cocina correspondiente
                cocina_order, created_cocina = Order.objects.get_or_create(
                    pedido_id=f"COCINA-{i:04d}",
                    defaults={
                        'plato': plato.nombre,
                        'orden': f"{cantidad}x {plato.nombre}\nMesa: {mesa.mesa_id}",
                        'estado': random.choice(estados_orden),
                        'preparacion': plato.ingredientes,
                        'tiempo_estimado': plato.tiempo_preparacion
                    }
                )
                
                if created:
                    self.stdout.write(f'  ✅ Orden {order_id} - {mesa.mesa_id}')
        
        # 7. Crear cajas
        self.stdout.write("\n💰 Creando cajas...")
        cajeros = list(User.objects.filter(role='cashier'))
        
        if cajeros:
            for i, cajero in enumerate(cajeros, 1):
                caja, created = Caja.objects.get_or_create(
                    numero_caja=f"CAJA-{i:02d}",
                    defaults={
                        'estado': 'abierta' if i == 1 else 'cerrada',
                        'saldo_inicial': Decimal('500.00'),
                        'saldo_actual': Decimal('500.00') if i == 1 else Decimal('0.00'),
                        'usuario_apertura': cajero
                    }
                )
                if created:
                    self.stdout.write(f'  ✅ {caja.numero_caja} - {caja.estado}')
        
        self.stdout.write(self.style.SUCCESS('\n\n✅ ¡Base de datos poblada exitosamente!'))
        self.stdout.write(self.style.SUCCESS('\n📊 Resumen de datos creados:'))
        self.stdout.write(f'   - Categorías de menú: {CategoriaMenu.objects.count()}')
        self.stdout.write(f'   - Platos: {Plato.objects.count()}')
        self.stdout.write(f'   - Items de inventario: {Inventario.objects.count()}')
        self.stdout.write(f'   - Mesas: {Table.objects.count()}')
        self.stdout.write(f'   - Órdenes de mesero: {WaiterOrder.objects.count()}')
        self.stdout.write(f'   - Órdenes de cocina: {Order.objects.count()}')
        self.stdout.write(f'   - Cajas: {Caja.objects.count()}')
        
        self.stdout.write(self.style.SUCCESS('\n🎯 Siguiente paso:'))
        self.stdout.write('   Ejecuta el servidor: python manage.py runserver')
        self.stdout.write('   Y conecta el frontend para ver los datos en acción')
