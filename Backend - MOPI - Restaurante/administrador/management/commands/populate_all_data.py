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
        
        # 2. Borrar menú existente
        self.stdout.write("\n🗑️ Borrando menú existente...")
        platos_borrados = Plato.objects.all().count()
        categorias_borradas = CategoriaMenu.objects.all().count()
        Plato.objects.all().delete()
        CategoriaMenu.objects.all().delete()
        self.stdout.write(f'  ✅ {platos_borrados} platos borrados')
        self.stdout.write(f'  ✅ {categorias_borradas} categorías borradas')
        
        # 3. Crear categorías de menú
        self.stdout.write("\n🍽️ Creando categorías de menú...")
        categorias_data = [
            {'nombre': 'CARNE DE RES', 'descripcion': 'Platos de carne de res', 'orden': 1},
            {'nombre': 'CARNE BLANCA', 'descripcion': 'Platos de pollo y aves', 'orden': 2},
            {'nombre': 'CARNE DE CERDO', 'descripcion': 'Platos de cerdo', 'orden': 3},
            {'nombre': 'VARIADOS', 'descripcion': 'Entradas y antojitos', 'orden': 4},
            {'nombre': 'MARISCOS', 'descripcion': 'Platos del mar', 'orden': 5},
            {'nombre': 'CARNE DE MONTE Y ENSALADAS', 'descripcion': 'Carne de monte y ensaladas (según ocasión)', 'orden': 6},
            {'nombre': 'COCTELES', 'descripcion': 'Cocteles y ceviches', 'orden': 7},
            {'nombre': 'SOPAS', 'descripcion': 'Sopas y consomés', 'orden': 8},
            {'nombre': 'ENLATADOS Y DESECHABLES', 'descripcion': 'Bebidas enlatadas y desechables', 'orden': 9},
            {'nombre': 'LICORES IMPORTADOS', 'descripcion': 'Licores importados', 'orden': 10},
            {'nombre': 'CERVEZA NACIONAL', 'descripcion': 'Cervezas nacionales', 'orden': 11},
            {'nombre': 'CERVEZA INTERNACIONAL', 'descripcion': 'Cervezas internacionales', 'orden': 12},
            {'nombre': 'CIGARROS', 'descripcion': 'Selecciones de cigarros nacionales e importados', 'orden': 13},
            {'nombre': 'RON NACIONAL', 'descripcion': 'Variedad de rones nacionales y Flor de Caña', 'orden': 14},
            {'nombre': 'COCTAILS Y VINOS', 'descripcion': 'Cocteles clásicos y selección de vinos', 'orden': 15},
            {'nombre': 'EXTRAS', 'descripcion': 'Acompañamientos y adicionales para tus platos', 'orden': 16},
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
        
        # 4. Crear platos
        self.stdout.write("\n🍴 Creando platos...")
        platos_data = [
            # CARNE DE RES
            {'nombre': 'Lomo de costilla asada', 'categoria': 'CARNE DE RES', 'precio': 410, 'ingredientes': 'Lomo de costilla, especias', 'tiempo_preparacion': 30},
            {'nombre': 'Lomo de costilla a la plancha', 'categoria': 'CARNE DE RES', 'precio': 440, 'ingredientes': 'Lomo de costilla', 'tiempo_preparacion': 25},
            {'nombre': 'Carne a la plancha', 'categoria': 'CARNE DE RES', 'precio': 400, 'ingredientes': 'Carne de res', 'tiempo_preparacion': 20},
            {'nombre': 'Filete de tacón alto', 'categoria': 'CARNE DE RES', 'precio': 400, 'ingredientes': 'Filete de res', 'tiempo_preparacion': 25},
            {'nombre': 'Filete miñón', 'categoria': 'CARNE DE RES', 'precio': 440, 'ingredientes': 'Filete miñón', 'tiempo_preparacion': 25},
            {'nombre': 'Filete criollo', 'categoria': 'CARNE DE RES', 'precio': 370, 'ingredientes': 'Filete de res, salsa criolla', 'tiempo_preparacion': 25},
            {'nombre': 'Filete jalapeño', 'categoria': 'CARNE DE RES', 'precio': 390, 'ingredientes': 'Filete de res, jalapeños', 'tiempo_preparacion': 25},
            {'nombre': 'Filete vaquero', 'categoria': 'CARNE DE RES', 'precio': 390, 'ingredientes': 'Filete de res estilo vaquero', 'tiempo_preparacion': 25},
            {'nombre': 'Churrasco', 'categoria': 'CARNE DE RES', 'precio': 390, 'ingredientes': 'Churrasco de res', 'tiempo_preparacion': 20},
            {'nombre': 'Filete Mi Rancho', 'categoria': 'CARNE DE RES', 'precio': 390, 'ingredientes': 'Filete especial de la casa', 'tiempo_preparacion': 25},
            {'nombre': 'Puyaso a la parrilla', 'categoria': 'CARNE DE RES', 'precio': 400, 'ingredientes': 'Puyaso a la parrilla', 'tiempo_preparacion': 30},
            {'nombre': 'New York asado', 'categoria': 'CARNE DE RES', 'precio': 420, 'ingredientes': 'Corte New York', 'tiempo_preparacion': 25},
            {'nombre': 'Filete de res a la pimienta', 'categoria': 'CARNE DE RES', 'precio': 380, 'ingredientes': 'Filete de res, pimienta', 'tiempo_preparacion': 25},
            {'nombre': 'Bistec mixto', 'categoria': 'CARNE DE RES', 'precio': 370, 'ingredientes': 'Bistec mixto', 'tiempo_preparacion': 20},
            {'nombre': 'Bistec encebollado', 'categoria': 'CARNE DE RES', 'precio': 370, 'ingredientes': 'Bistec con cebolla', 'tiempo_preparacion': 20},
            {'nombre': 'Bistec entomatado', 'categoria': 'CARNE DE RES', 'precio': 370, 'ingredientes': 'Bistec con tomate', 'tiempo_preparacion': 20},
            {'nombre': 'Corazón asado', 'categoria': 'CARNE DE RES', 'precio': 300, 'ingredientes': 'Corazón de res asado', 'tiempo_preparacion': 25},
            {'nombre': 'Gonce asado', 'categoria': 'CARNE DE RES', 'precio': 320, 'ingredientes': 'Gonce asado', 'tiempo_preparacion': 30},
            {'nombre': 'Lengua en salsa', 'categoria': 'CARNE DE RES', 'precio': 360, 'ingredientes': 'Lengua de res en salsa', 'tiempo_preparacion': 40},
            {'nombre': 'Lengua empanizada', 'categoria': 'CARNE DE RES', 'precio': 360, 'ingredientes': 'Lengua empanizada', 'tiempo_preparacion': 35},
            {'nombre': 'Brocheta de res', 'categoria': 'CARNE DE RES', 'precio': 370, 'ingredientes': 'Brocheta de res', 'tiempo_preparacion': 20},
            {'nombre': 'Brocheta mixta', 'categoria': 'CARNE DE RES', 'precio': 370, 'ingredientes': 'Brocheta mixta', 'tiempo_preparacion': 20},
            {'nombre': 'Huevo de toro a la plancha', 'categoria': 'CARNE DE RES', 'precio': 340, 'ingredientes': 'Huevo de toro', 'tiempo_preparacion': 20},
            {'nombre': 'Huevo de toro en salsa', 'categoria': 'CARNE DE RES', 'precio': 340, 'ingredientes': 'Huevo de toro en salsa', 'tiempo_preparacion': 25},
            {'nombre': 'Huevo de toro asado', 'categoria': 'CARNE DE RES', 'precio': 330, 'ingredientes': 'Huevo de toro asado', 'tiempo_preparacion': 25},
            
            # CARNE BLANCA
            {'nombre': 'Filete de pollo jalapeño', 'categoria': 'CARNE BLANCA', 'precio': 380, 'ingredientes': 'Filete de pollo, jalapeños', 'tiempo_preparacion': 20},
            {'nombre': 'Filete de pollo a la plancha', 'categoria': 'CARNE BLANCA', 'precio': 380, 'ingredientes': 'Filete de pollo', 'tiempo_preparacion': 20},
            {'nombre': 'Filete de pollo en salsa de hongos', 'categoria': 'CARNE BLANCA', 'precio': 380, 'ingredientes': 'Filete de pollo, hongos', 'tiempo_preparacion': 20},
            {'nombre': 'Filete de pollo a la antigua', 'categoria': 'CARNE BLANCA', 'precio': 360, 'ingredientes': 'Filete de pollo', 'tiempo_preparacion': 20},
            {'nombre': 'Filete de pollo parmesano', 'categoria': 'CARNE BLANCA', 'precio': 360, 'ingredientes': 'Filete de pollo, queso parmesano', 'tiempo_preparacion': 20},
            {'nombre': 'Filete de pollo al ajillo', 'categoria': 'CARNE BLANCA', 'precio': 360, 'ingredientes': 'Filete de pollo, ajo', 'tiempo_preparacion': 20},
            {'nombre': 'Filete de pollo a la naranja', 'categoria': 'CARNE BLANCA', 'precio': 340, 'ingredientes': 'Filete de pollo, naranja', 'tiempo_preparacion': 20},
            {'nombre': 'Filete de pollo empanizado', 'categoria': 'CARNE BLANCA', 'precio': 330, 'ingredientes': 'Filete de pollo empanizado', 'tiempo_preparacion': 20},
            {'nombre': 'Cordon bleu de pollo', 'categoria': 'CARNE BLANCA', 'precio': 360, 'ingredientes': 'Pollo, jamón, queso', 'tiempo_preparacion': 25},
            {'nombre': 'Ensalada de pollo', 'categoria': 'CARNE BLANCA', 'precio': 340, 'ingredientes': 'Pollo, lechuga, vegetales', 'tiempo_preparacion': 15},
            {'nombre': 'Brocheta de pollo', 'categoria': 'CARNE BLANCA', 'precio': 320, 'ingredientes': 'Brocheta de pollo', 'tiempo_preparacion': 20},
            {'nombre': 'Pollo al vino', 'categoria': 'CARNE BLANCA', 'precio': 340, 'ingredientes': 'Pollo, vino', 'tiempo_preparacion': 25},
            {'nombre': 'Pollo a la plancha', 'categoria': 'CARNE BLANCA', 'precio': 340, 'ingredientes': 'Pollo a la plancha', 'tiempo_preparacion': 20},
            {'nombre': 'Pollo empanizado', 'categoria': 'CARNE BLANCA', 'precio': 320, 'ingredientes': 'Pollo empanizado', 'tiempo_preparacion': 20},
            {'nombre': 'Medio pollo asado', 'categoria': 'CARNE BLANCA', 'precio': 320, 'ingredientes': 'Medio pollo asado', 'tiempo_preparacion': 30},
            {'nombre': 'Cuarto de pollo asado', 'categoria': 'CARNE BLANCA', 'precio': 260, 'ingredientes': 'Cuarto de pollo asado', 'tiempo_preparacion': 25},
            {'nombre': 'Fajita de pollo empanizado', 'categoria': 'CARNE BLANCA', 'precio': 300, 'ingredientes': 'Fajita de pollo empanizado', 'tiempo_preparacion': 20},
            {'nombre': 'Fajita de pollo a la mexicana', 'categoria': 'CARNE BLANCA', 'precio': 300, 'ingredientes': 'Fajita de pollo, vegetales', 'tiempo_preparacion': 20},
            {'nombre': 'Bombones de pollo', 'categoria': 'CARNE BLANCA', 'precio': 280, 'ingredientes': 'Bombones de pollo', 'tiempo_preparacion': 15},
            {'nombre': 'Pechuga rellena', 'categoria': 'CARNE BLANCA', 'precio': 330, 'ingredientes': 'Pechuga de pollo rellena', 'tiempo_preparacion': 25},
            {'nombre': 'Canasta de pollo', 'categoria': 'CARNE BLANCA', 'precio': 300, 'ingredientes': 'Canasta de pollo', 'tiempo_preparacion': 20},
            {'nombre': 'Alitas picantes', 'categoria': 'CARNE BLANCA', 'precio': 290, 'ingredientes': 'Alitas picantes', 'tiempo_preparacion': 20},
            {'nombre': 'Alitas a la barbacoa', 'categoria': 'CARNE BLANCA', 'precio': 300, 'ingredientes': 'Alitas con salsa barbacoa', 'tiempo_preparacion': 20},
            {'nombre': 'Pasta Alfredo de pollo', 'categoria': 'CARNE BLANCA', 'precio': 360, 'ingredientes': 'Pasta, pollo, salsa Alfredo', 'tiempo_preparacion': 20},
            
            # CARNE DE CERDO
            {'nombre': 'Cerdo a la plancha', 'categoria': 'CARNE DE CERDO', 'precio': 360, 'ingredientes': 'Cerdo a la plancha', 'tiempo_preparacion': 20},
            {'nombre': 'Filete de cerdo al ajillo', 'categoria': 'CARNE DE CERDO', 'precio': 360, 'ingredientes': 'Filete de cerdo, ajo', 'tiempo_preparacion': 20},
            {'nombre': 'Filete de cerdo empanizado', 'categoria': 'CARNE DE CERDO', 'precio': 360, 'ingredientes': 'Filete de cerdo empanizado', 'tiempo_preparacion': 20},
            {'nombre': 'Filete de cerdo agridulce', 'categoria': 'CARNE DE CERDO', 'precio': 360, 'ingredientes': 'Filete de cerdo, salsa agridulce', 'tiempo_preparacion': 20},
            {'nombre': 'Filete de cerdo jalapeño', 'categoria': 'CARNE DE CERDO', 'precio': 360, 'ingredientes': 'Filete de cerdo, jalapeños', 'tiempo_preparacion': 20},
            {'nombre': 'Filete de cerdo criollo', 'categoria': 'CARNE DE CERDO', 'precio': 330, 'ingredientes': 'Filete de cerdo, salsa criolla', 'tiempo_preparacion': 20},
            {'nombre': 'Filete de cerdo asado', 'categoria': 'CARNE DE CERDO', 'precio': 330, 'ingredientes': 'Filete de cerdo asado', 'tiempo_preparacion': 25},
            {'nombre': 'Brocheta de cerdo', 'categoria': 'CARNE DE CERDO', 'precio': 330, 'ingredientes': 'Brocheta de cerdo', 'tiempo_preparacion': 20},
            {'nombre': 'Medallones de cerdo', 'categoria': 'CARNE DE CERDO', 'precio': 380, 'ingredientes': 'Medallones de cerdo', 'tiempo_preparacion': 25},
            {'nombre': 'Costilla de cerdo asada', 'categoria': 'CARNE DE CERDO', 'precio': 340, 'ingredientes': 'Costilla de cerdo asada', 'tiempo_preparacion': 30},
            {'nombre': 'Costilla de cerdo frita', 'categoria': 'CARNE DE CERDO', 'precio': 340, 'ingredientes': 'Costilla de cerdo frita', 'tiempo_preparacion': 25},
            {'nombre': 'Costilla de cerdo a la barbacoa', 'categoria': 'CARNE DE CERDO', 'precio': 350, 'ingredientes': 'Costilla de cerdo, salsa barbacoa', 'tiempo_preparacion': 30},
            
            # MARISCOS
            {'nombre': 'Pescado frito', 'categoria': 'MARISCOS', 'precio': 0, 'ingredientes': 'Pescado frito', 'tiempo_preparacion': 20},
            {'nombre': 'Pescado a la diabla', 'categoria': 'MARISCOS', 'precio': 0, 'ingredientes': 'Pescado, salsa diabla', 'tiempo_preparacion': 25},
            {'nombre': 'Pescado a lo macho con espinas', 'categoria': 'MARISCOS', 'precio': 0, 'ingredientes': 'Pescado a lo macho', 'tiempo_preparacion': 30},
            {'nombre': 'Pescado a lo macho deshuesado', 'categoria': 'MARISCOS', 'precio': 0, 'ingredientes': 'Pescado deshuesado', 'tiempo_preparacion': 35},
            {'nombre': 'Pargo rojo', 'categoria': 'MARISCOS', 'precio': 400, 'ingredientes': 'Pargo rojo por libra', 'tiempo_preparacion': 25},
            {'nombre': 'Pescado al vapor', 'categoria': 'MARISCOS', 'precio': 0, 'ingredientes': 'Pescado al vapor', 'tiempo_preparacion': 20},
            {'nombre': 'Pescado a la Tipitapa', 'categoria': 'MARISCOS', 'precio': 0, 'ingredientes': 'Pescado estilo Tipitapa', 'tiempo_preparacion': 25},
            {'nombre': 'Pescado relleno', 'categoria': 'MARISCOS', 'precio': 0, 'ingredientes': 'Pescado relleno', 'tiempo_preparacion': 30},
            {'nombre': 'Pescado asado', 'categoria': 'MARISCOS', 'precio': 0, 'ingredientes': 'Pescado asado', 'tiempo_preparacion': 25},
            {'nombre': 'Filete de pescado al vapor', 'categoria': 'MARISCOS', 'precio': 340, 'ingredientes': 'Filete de pescado al vapor', 'tiempo_preparacion': 20},
            {'nombre': 'Filete de pescado a la plancha', 'categoria': 'MARISCOS', 'precio': 350, 'ingredientes': 'Filete de pescado a la plancha', 'tiempo_preparacion': 20},
            {'nombre': 'Filete de pescado al ajillo', 'categoria': 'MARISCOS', 'precio': 350, 'ingredientes': 'Filete de pescado, ajo', 'tiempo_preparacion': 20},
            {'nombre': 'Filete de pescado empanizado', 'categoria': 'MARISCOS', 'precio': 340, 'ingredientes': 'Filete de pescado empanizado', 'tiempo_preparacion': 20},
            {'nombre': 'Fajitas de pescado', 'categoria': 'MARISCOS', 'precio': 340, 'ingredientes': 'Fajitas de pescado', 'tiempo_preparacion': 20},
            {'nombre': 'Camarones empanizados', 'categoria': 'MARISCOS', 'precio': 400, 'ingredientes': 'Camarones empanizados', 'tiempo_preparacion': 20},
            {'nombre': 'Camarones rellenos', 'categoria': 'MARISCOS', 'precio': 400, 'ingredientes': 'Camarones rellenos', 'tiempo_preparacion': 25},
            {'nombre': 'Camarones al ajillo', 'categoria': 'MARISCOS', 'precio': 400, 'ingredientes': 'Camarones, ajo', 'tiempo_preparacion': 15},
            {'nombre': 'Camarones al vino', 'categoria': 'MARISCOS', 'precio': 400, 'ingredientes': 'Camarones, vino', 'tiempo_preparacion': 20},
            {'nombre': 'Camarones a la plancha', 'categoria': 'MARISCOS', 'precio': 400, 'ingredientes': 'Camarones a la plancha', 'tiempo_preparacion': 15},
            {'nombre': 'Camarones termidor', 'categoria': 'MARISCOS', 'precio': 400, 'ingredientes': 'Camarones termidor', 'tiempo_preparacion': 25},
            {'nombre': 'Camarones a la diabla', 'categoria': 'MARISCOS', 'precio': 400, 'ingredientes': 'Camarones, salsa diabla', 'tiempo_preparacion': 20},
            {'nombre': 'Camarones Singapur', 'categoria': 'MARISCOS', 'precio': 400, 'ingredientes': 'Camarones estilo Singapur', 'tiempo_preparacion': 20},
            {'nombre': 'Camarones a la mantequilla', 'categoria': 'MARISCOS', 'precio': 400, 'ingredientes': 'Camarones, mantequilla', 'tiempo_preparacion': 15},
            {'nombre': 'Camarones en salsa jalapeña', 'categoria': 'MARISCOS', 'precio': 400, 'ingredientes': 'Camarones, salsa jalapeña', 'tiempo_preparacion': 20},
            {'nombre': 'Camarones rancheros', 'categoria': 'MARISCOS', 'precio': 400, 'ingredientes': 'Camarones rancheros', 'tiempo_preparacion': 20},
            {'nombre': 'Ensalada de camarones', 'categoria': 'MARISCOS', 'precio': 400, 'ingredientes': 'Ensalada de camarones', 'tiempo_preparacion': 15},
            {'nombre': 'Arroz con camarón', 'categoria': 'MARISCOS', 'precio': 400, 'ingredientes': 'Arroz con camarón', 'tiempo_preparacion': 25},
            {'nombre': 'Langosta rellena', 'categoria': 'MARISCOS', 'precio': 620, 'ingredientes': 'Langosta rellena', 'tiempo_preparacion': 35},
            {'nombre': 'Pasta Alfredo de camarón', 'categoria': 'MARISCOS', 'precio': 400, 'ingredientes': 'Pasta, camarón, salsa Alfredo', 'tiempo_preparacion': 20},
            
            # VARIADOS
            {'nombre': 'Variado especial Mi Rancho', 'categoria': 'VARIADOS', 'precio': 1200, 'ingredientes': 'Variado especial de la casa', 'tiempo_preparacion': 45},
            {'nombre': 'Variado especial Don Pepe', 'categoria': 'VARIADOS', 'precio': 850, 'ingredientes': 'Variado especial', 'tiempo_preparacion': 40},
            {'nombre': 'Variado grande', 'categoria': 'VARIADOS', 'precio': 600, 'ingredientes': 'Variado grande', 'tiempo_preparacion': 35},
            {'nombre': 'Variado pequeño', 'categoria': 'VARIADOS', 'precio': 520, 'ingredientes': 'Variado pequeño', 'tiempo_preparacion': 30},
            {'nombre': 'Tostones con queso', 'categoria': 'VARIADOS', 'precio': 200, 'ingredientes': 'Tostones, queso', 'tiempo_preparacion': 15},
            {'nombre': 'Tostones con bolitas de carne', 'categoria': 'VARIADOS', 'precio': 320, 'ingredientes': 'Tostones, bolitas de carne', 'tiempo_preparacion': 20},
            {'nombre': 'Tostones con salchichón', 'categoria': 'VARIADOS', 'precio': 200, 'ingredientes': 'Tostones, salchichón', 'tiempo_preparacion': 15},
            {'nombre': 'Tostones mixtos', 'categoria': 'VARIADOS', 'precio': 240, 'ingredientes': 'Tostones mixtos', 'tiempo_preparacion': 15},
            {'nombre': 'Aros de cebolla', 'categoria': 'VARIADOS', 'precio': 95, 'ingredientes': 'Aros de cebolla', 'tiempo_preparacion': 10},
            {'nombre': 'Papas fritas', 'categoria': 'VARIADOS', 'precio': 80, 'ingredientes': 'Papas fritas', 'tiempo_preparacion': 10},
            
            # CARNE DE MONTE Y ENSALADAS
            {'nombre': 'Garrobo asado', 'categoria': 'CARNE DE MONTE Y ENSALADAS', 'precio': 300, 'ingredientes': 'Garrobo asado', 'tiempo_preparacion': 30},
            {'nombre': 'Garrobo a la plancha', 'categoria': 'CARNE DE MONTE Y ENSALADAS', 'precio': 330, 'ingredientes': 'Garrobo a la plancha', 'tiempo_preparacion': 25},
            {'nombre': 'Garrobo desmenuzado', 'categoria': 'CARNE DE MONTE Y ENSALADAS', 'precio': 310, 'ingredientes': 'Garrobo desmenuzado', 'tiempo_preparacion': 30},
            {'nombre': 'Medio conejo asado', 'categoria': 'CARNE DE MONTE Y ENSALADAS', 'precio': 320, 'ingredientes': 'Medio conejo asado', 'tiempo_preparacion': 35},
            {'nombre': 'Medio conejo desmenuzado', 'categoria': 'CARNE DE MONTE Y ENSALADAS', 'precio': 320, 'ingredientes': 'Medio conejo desmenuzado', 'tiempo_preparacion': 35},
            {'nombre': 'Conejo entero asado', 'categoria': 'CARNE DE MONTE Y ENSALADAS', 'precio': 570, 'ingredientes': 'Conejo entero asado', 'tiempo_preparacion': 50},
            {'nombre': 'Conejo entero desmenuzado', 'categoria': 'CARNE DE MONTE Y ENSALADAS', 'precio': 570, 'ingredientes': 'Conejo entero desmenuzado', 'tiempo_preparacion': 50},
            {'nombre': 'Cuzuco asado', 'categoria': 'CARNE DE MONTE Y ENSALADAS', 'precio': 330, 'ingredientes': 'Cuzuco asado', 'tiempo_preparacion': 35},
            {'nombre': 'Cuzuco desmenuzado', 'categoria': 'CARNE DE MONTE Y ENSALADAS', 'precio': 330, 'ingredientes': 'Cuzuco desmenuzado', 'tiempo_preparacion': 35},
            {'nombre': 'Ensalada de aguacate', 'categoria': 'CARNE DE MONTE Y ENSALADAS', 'precio': 320, 'ingredientes': 'Aguacate, vegetales frescos', 'tiempo_preparacion': 10},
            
            # COCTELES
            {'nombre': 'Coctel de camarón Don Pepe', 'categoria': 'COCTELES', 'precio': 230, 'ingredientes': 'Camarón, salsa especial', 'tiempo_preparacion': 15},
            {'nombre': 'Coctel de camarón', 'categoria': 'COCTELES', 'precio': 200, 'ingredientes': 'Camarón, salsa coctel', 'tiempo_preparacion': 15},
            {'nombre': 'Coctel de conchas negras', 'categoria': 'COCTELES', 'precio': 190, 'ingredientes': 'Conchas negras', 'tiempo_preparacion': 15},
            {'nombre': 'Ceviche mixto Don Pepe', 'categoria': 'COCTELES', 'precio': 320, 'ingredientes': 'Mariscos mixtos, limón', 'tiempo_preparacion': 20},
            {'nombre': 'Ceviche de camarón', 'categoria': 'COCTELES', 'precio': 200, 'ingredientes': 'Camarón, limón, cebolla', 'tiempo_preparacion': 15},
            {'nombre': 'Ceviche de pescado', 'categoria': 'COCTELES', 'precio': 200, 'ingredientes': 'Pescado, limón, cebolla', 'tiempo_preparacion': 15},
            {'nombre': 'Ceviche de huevo de toro', 'categoria': 'COCTELES', 'precio': 200, 'ingredientes': 'Huevo de toro, limón', 'tiempo_preparacion': 15},
            {'nombre': 'Huevo de paslama a la ostra (3 unidades)', 'categoria': 'COCTELES', 'precio': 160, 'ingredientes': 'Huevo de paslama', 'tiempo_preparacion': 10},
            {'nombre': 'Huevo de paslama con yuca (6 unidades)', 'categoria': 'COCTELES', 'precio': 320, 'ingredientes': 'Huevo de paslama, yuca', 'tiempo_preparacion': 20},
            
            # SOPAS
            {'nombre': 'Sopa de marisco sin langosta', 'categoria': 'SOPAS', 'precio': 310, 'ingredientes': 'Mariscos variados', 'tiempo_preparacion': 30},
            {'nombre': 'Sopa de marisco con langosta', 'categoria': 'SOPAS', 'precio': 420, 'ingredientes': 'Mariscos, langosta', 'tiempo_preparacion': 35},
            {'nombre': 'Sopa de huevo de toro con médula', 'categoria': 'SOPAS', 'precio': 310, 'ingredientes': 'Huevo de toro, médula', 'tiempo_preparacion': 35},
            {'nombre': 'Sopa de garrobo', 'categoria': 'SOPAS', 'precio': 310, 'ingredientes': 'Garrobo', 'tiempo_preparacion': 40},
            {'nombre': 'Sopa de garrobo con punche', 'categoria': 'SOPAS', 'precio': 350, 'ingredientes': 'Garrobo, punche', 'tiempo_preparacion': 45},
            {'nombre': 'Sopa de pollo', 'categoria': 'SOPAS', 'precio': 290, 'ingredientes': 'Pollo, vegetales', 'tiempo_preparacion': 30},
            {'nombre': 'Consomé de camarón', 'categoria': 'SOPAS', 'precio': 190, 'ingredientes': 'Camarón, consomé', 'tiempo_preparacion': 20},
            {'nombre': 'Consomé de pollo', 'categoria': 'SOPAS', 'precio': 190, 'ingredientes': 'Pollo, consomé', 'tiempo_preparacion': 20},
            
            # ENLATADOS Y DESECHABLES
            {'nombre': 'Gaseosa 12 oz', 'categoria': 'ENLATADOS Y DESECHABLES', 'precio': 45, 'ingredientes': 'Gaseosa', 'tiempo_preparacion': 1},
            {'nombre': 'Gaseosa desechable 500ml', 'categoria': 'ENLATADOS Y DESECHABLES', 'precio': 55, 'ingredientes': 'Gaseosa', 'tiempo_preparacion': 1},
            {'nombre': 'Jugo de naranja', 'categoria': 'ENLATADOS Y DESECHABLES', 'precio': 48, 'ingredientes': 'Jugo de naranja', 'tiempo_preparacion': 1},
            {'nombre': 'Jugo de lata', 'categoria': 'ENLATADOS Y DESECHABLES', 'precio': 42, 'ingredientes': 'Jugo enlatado', 'tiempo_preparacion': 1},
            {'nombre': 'Hidratantes/energizantes', 'categoria': 'ENLATADOS Y DESECHABLES', 'precio': 60, 'ingredientes': 'Bebida energizante', 'tiempo_preparacion': 1},
            {'nombre': 'Hi-C', 'categoria': 'ENLATADOS Y DESECHABLES', 'precio': 38, 'ingredientes': 'Hi-C', 'tiempo_preparacion': 1},
            {'nombre': 'Hi-C-T', 'categoria': 'ENLATADOS Y DESECHABLES', 'precio': 45, 'ingredientes': 'Hi-C-T', 'tiempo_preparacion': 1},
            {'nombre': 'Té frío', 'categoria': 'ENLATADOS Y DESECHABLES', 'precio': 42, 'ingredientes': 'Té frío', 'tiempo_preparacion': 1},
            {'nombre': 'Té Lipton', 'categoria': 'ENLATADOS Y DESECHABLES', 'precio': 48, 'ingredientes': 'Té Lipton', 'tiempo_preparacion': 1},
            {'nombre': 'Agua embotellada 500ml', 'categoria': 'ENLATADOS Y DESECHABLES', 'precio': 45, 'ingredientes': 'Agua purificada', 'tiempo_preparacion': 1},
            {'nombre': 'Limonada', 'categoria': 'ENLATADOS Y DESECHABLES', 'precio': 55, 'ingredientes': 'Limonada natural', 'tiempo_preparacion': 5},
            {'nombre': 'Refresco natural', 'categoria': 'ENLATADOS Y DESECHABLES', 'precio': 50, 'ingredientes': 'Refresco natural', 'tiempo_preparacion': 5},
            
            # LICORES IMPORTADOS
            {'nombre': 'Johnny Walker/Botella', 'categoria': 'LICORES IMPORTADOS', 'precio': 1450, 'ingredientes': 'Johnny Walker', 'tiempo_preparacion': 1},
            {'nombre': 'Johnny Walker/Media', 'categoria': 'LICORES IMPORTADOS', 'precio': 750, 'ingredientes': 'Johnny Walker', 'tiempo_preparacion': 1},
            {'nombre': 'Finlandia/Botella', 'categoria': 'LICORES IMPORTADOS', 'precio': 820, 'ingredientes': 'Vodka Finlandia', 'tiempo_preparacion': 1},
            {'nombre': 'Finlandia Cuarto', 'categoria': 'LICORES IMPORTADOS', 'precio': 250, 'ingredientes': 'Vodka Finlandia', 'tiempo_preparacion': 1},
            {'nombre': 'Finlandia Media', 'categoria': 'LICORES IMPORTADOS', 'precio': 430, 'ingredientes': 'Vodka Finlandia', 'tiempo_preparacion': 1},
            {'nombre': 'Stolichnaya/Botella', 'categoria': 'LICORES IMPORTADOS', 'precio': 1400, 'ingredientes': 'Vodka Stolichnaya', 'tiempo_preparacion': 1},
            {'nombre': 'Stolichnaya/Cuarto', 'categoria': 'LICORES IMPORTADOS', 'precio': 375, 'ingredientes': 'Vodka Stolichnaya', 'tiempo_preparacion': 1},
            {'nombre': 'Stolichnaya/Media', 'categoria': 'LICORES IMPORTADOS', 'precio': 725, 'ingredientes': 'Vodka Stolichnaya', 'tiempo_preparacion': 1},
            {'nombre': 'Jose Cuervo/Botella', 'categoria': 'LICORES IMPORTADOS', 'precio': 1480, 'ingredientes': 'Tequila Jose Cuervo', 'tiempo_preparacion': 1},
            {'nombre': 'Jose Cuervo/Media', 'categoria': 'LICORES IMPORTADOS', 'precio': 780, 'ingredientes': 'Tequila Jose Cuervo', 'tiempo_preparacion': 1},
            {'nombre': 'Petrov/Botella', 'categoria': 'LICORES IMPORTADOS', 'precio': 400, 'ingredientes': 'Vodka Petrov', 'tiempo_preparacion': 1},
            {'nombre': 'Petrov/Media', 'categoria': 'LICORES IMPORTADOS', 'precio': 250, 'ingredientes': 'Vodka Petrov', 'tiempo_preparacion': 1},
            {'nombre': 'Wisky John Barr (N) 1/2', 'categoria': 'LICORES IMPORTADOS', 'precio': 400, 'ingredientes': 'Whisky John Barr', 'tiempo_preparacion': 1},
            {'nombre': 'Wisky John Barr (N) Botella', 'categoria': 'LICORES IMPORTADOS', 'precio': 750, 'ingredientes': 'Whisky John Barr', 'tiempo_preparacion': 1},
            {'nombre': 'Wisky John Barr (D) 1/2', 'categoria': 'LICORES IMPORTADOS', 'precio': 350, 'ingredientes': 'Whisky John Barr', 'tiempo_preparacion': 1},
            {'nombre': 'Wisky John Barr (D) Botella', 'categoria': 'LICORES IMPORTADOS', 'precio': 650, 'ingredientes': 'Whisky John Barr', 'tiempo_preparacion': 1},
            {'nombre': 'Tequila Jimador 1/2', 'categoria': 'LICORES IMPORTADOS', 'precio': 500, 'ingredientes': 'Tequila Jimador', 'tiempo_preparacion': 1},
            {'nombre': 'Tequila Jimador Botella', 'categoria': 'LICORES IMPORTADOS', 'precio': 1000, 'ingredientes': 'Tequila Jimador', 'tiempo_preparacion': 1},
            {'nombre': 'Tragos individuales', 'categoria': 'LICORES IMPORTADOS', 'precio': 80, 'ingredientes': 'Licor individual', 'tiempo_preparacion': 1},
            
            # CERVEZA NACIONAL
            {'nombre': 'Victoria Frost 12 oz', 'categoria': 'CERVEZA NACIONAL', 'precio': 52, 'ingredientes': 'Cerveza Victoria Frost', 'tiempo_preparacion': 1},
            {'nombre': 'Victoria Frost Litro', 'categoria': 'CERVEZA NACIONAL', 'precio': 85, 'ingredientes': 'Cerveza Victoria Frost', 'tiempo_preparacion': 1},
            {'nombre': 'Victoria Clásica 12 oz', 'categoria': 'CERVEZA NACIONAL', 'precio': 60, 'ingredientes': 'Cerveza Victoria Clásica', 'tiempo_preparacion': 1},
            {'nombre': 'Victoria Clásica Litro', 'categoria': 'CERVEZA NACIONAL', 'precio': 100, 'ingredientes': 'Cerveza Victoria Clásica', 'tiempo_preparacion': 1},
            {'nombre': 'Toña 12 oz', 'categoria': 'CERVEZA NACIONAL', 'precio': 60, 'ingredientes': 'Cerveza Toña', 'tiempo_preparacion': 1},
            {'nombre': 'Toña Litro', 'categoria': 'CERVEZA NACIONAL', 'precio': 100, 'ingredientes': 'Cerveza Toña', 'tiempo_preparacion': 1},
            {'nombre': 'Toña Lata', 'categoria': 'CERVEZA NACIONAL', 'precio': 65, 'ingredientes': 'Cerveza Toña', 'tiempo_preparacion': 1},
            {'nombre': 'Toña Ultra 12 oz', 'categoria': 'CERVEZA NACIONAL', 'precio': 60, 'ingredientes': 'Cerveza Toña Ultra', 'tiempo_preparacion': 1},
            {'nombre': 'Toña Light 12 oz', 'categoria': 'CERVEZA NACIONAL', 'precio': 60, 'ingredientes': 'Cerveza Toña Light', 'tiempo_preparacion': 1},
            {'nombre': 'Hard Seltzer Spark', 'categoria': 'CERVEZA NACIONAL', 'precio': 64, 'ingredientes': 'Hard Seltzer', 'tiempo_preparacion': 1},
            {'nombre': 'Adan y Eva', 'categoria': 'CERVEZA NACIONAL', 'precio': 60, 'ingredientes': 'Cerveza Adan y Eva', 'tiempo_preparacion': 1},
            {'nombre': 'Chelada', 'categoria': 'CERVEZA NACIONAL', 'precio': 45, 'ingredientes': 'Chelada preparada', 'tiempo_preparacion': 3},
            {'nombre': 'Michelada', 'categoria': 'CERVEZA NACIONAL', 'precio': 60, 'ingredientes': 'Michelada preparada', 'tiempo_preparacion': 3},
            
            # CERVEZA INTERNACIONAL
            {'nombre': 'Miller lite', 'categoria': 'CERVEZA INTERNACIONAL', 'precio': 65, 'ingredientes': 'Cerveza Miller lite', 'tiempo_preparacion': 1},
            {'nombre': 'Sol', 'categoria': 'CERVEZA INTERNACIONAL', 'precio': 84, 'ingredientes': 'Cerveza Sol', 'tiempo_preparacion': 1},
            {'nombre': 'Heineken', 'categoria': 'CERVEZA INTERNACIONAL', 'precio': 89, 'ingredientes': 'Cerveza Heineken', 'tiempo_preparacion': 1},
            {'nombre': 'Corona', 'categoria': 'CERVEZA INTERNACIONAL', 'precio': 90, 'ingredientes': 'Cerveza Corona', 'tiempo_preparacion': 1},
            {'nombre': 'Smirnoft', 'categoria': 'CERVEZA INTERNACIONAL', 'precio': 90, 'ingredientes': 'Smirnoft', 'tiempo_preparacion': 1},
            {'nombre': 'Bliss', 'categoria': 'CERVEZA INTERNACIONAL', 'precio': 83, 'ingredientes': 'Bliss', 'tiempo_preparacion': 1},
            {'nombre': 'Bamboo', 'categoria': 'CERVEZA INTERNACIONAL', 'precio': 69, 'ingredientes': 'Bamboo', 'tiempo_preparacion': 1},
            {'nombre': 'Fusion', 'categoria': 'CERVEZA INTERNACIONAL', 'precio': 74, 'ingredientes': 'Fusion', 'tiempo_preparacion': 1},
            
            # CIGARROS
            {'nombre': 'Belmont 1/2', 'categoria': 'CIGARROS', 'precio': 80, 'ingredientes': 'Medio paquete de cigarros Belmont', 'tiempo_preparacion': 1},
            {'nombre': 'Belmont doble click 1/2', 'categoria': 'CIGARROS', 'precio': 85, 'ingredientes': 'Medio paquete de Belmont Double Click', 'tiempo_preparacion': 1},
            {'nombre': 'Dunhill 1/2', 'categoria': 'CIGARROS', 'precio': 80, 'ingredientes': 'Medio paquete de cigarros Dunhill', 'tiempo_preparacion': 1},
            {'nombre': 'PallMall 1/2', 'categoria': 'CIGARROS', 'precio': 80, 'ingredientes': 'Medio paquete de cigarros PallMall', 'tiempo_preparacion': 1},
            
            # RON NACIONAL
            {'nombre': 'Centenario 12 años 1/2', 'categoria': 'RON NACIONAL', 'precio': 730, 'ingredientes': 'Ron Centenario 12 años', 'tiempo_preparacion': 2},
            {'nombre': 'Centenario 18 años 1/2', 'categoria': 'RON NACIONAL', 'precio': 870, 'ingredientes': 'Ron Centenario 18 años', 'tiempo_preparacion': 2},
            {'nombre': 'Gran Reserva FC 1/2', 'categoria': 'RON NACIONAL', 'precio': 340, 'ingredientes': 'Flor de Caña Gran Reserva', 'tiempo_preparacion': 2},
            {'nombre': 'Gran Reserva FC 1/4', 'categoria': 'RON NACIONAL', 'precio': 180, 'ingredientes': 'Flor de Caña Gran Reserva', 'tiempo_preparacion': 2},
            {'nombre': 'Extra Lite FC 1/2', 'categoria': 'RON NACIONAL', 'precio': 250, 'ingredientes': 'Flor de Caña Extra Lite', 'tiempo_preparacion': 2},
            {'nombre': 'Extra Lite FC 1/4', 'categoria': 'RON NACIONAL', 'precio': 135, 'ingredientes': 'Flor de Caña Extra Lite', 'tiempo_preparacion': 2},
            {'nombre': 'Ultra Lite FC 1/2', 'categoria': 'RON NACIONAL', 'precio': 230, 'ingredientes': 'Flor de Caña Ultra Lite', 'tiempo_preparacion': 2},
            {'nombre': 'Ultra Lite FC 1/4', 'categoria': 'RON NACIONAL', 'precio': 125, 'ingredientes': 'Flor de Caña Ultra Lite', 'tiempo_preparacion': 2},
            {'nombre': 'Trago FC (selección variable)', 'categoria': 'RON NACIONAL', 'precio': 0, 'ingredientes': 'Trago Flor de Caña según selección del cliente', 'tiempo_preparacion': 2},
            {'nombre': 'Cristalino FC 1/2', 'categoria': 'RON NACIONAL', 'precio': 575, 'ingredientes': 'Flor de Caña Cristalino', 'tiempo_preparacion': 2},
            {'nombre': 'Cristalino FC Botella', 'categoria': 'RON NACIONAL', 'precio': 1050, 'ingredientes': 'Flor de Caña Cristalino', 'tiempo_preparacion': 2},
            {'nombre': 'FC Expresso 1/2', 'categoria': 'RON NACIONAL', 'precio': 270, 'ingredientes': 'Flor de Caña Expresso', 'tiempo_preparacion': 2},
            
            # COCTAILS Y VINOS
            {'nombre': 'Margarita', 'categoria': 'COCTAILS Y VINOS', 'precio': 120, 'ingredientes': 'Coctel Margarita preparado al instante', 'tiempo_preparacion': 5},
            {'nombre': 'Piña colada', 'categoria': 'COCTAILS Y VINOS', 'precio': 130, 'ingredientes': 'Piña colada cremosa', 'tiempo_preparacion': 5},
            {'nombre': 'Mojito', 'categoria': 'COCTAILS Y VINOS', 'precio': 100, 'ingredientes': 'Mojito tradicional con hierbabuena', 'tiempo_preparacion': 5},
            {'nombre': 'Strawberry', 'categoria': 'COCTAILS Y VINOS', 'precio': 120, 'ingredientes': 'Coctel de fresa estilo daiquiri', 'tiempo_preparacion': 5},
            {'nombre': 'Vino tinto/blanco Botella', 'categoria': 'COCTAILS Y VINOS', 'precio': 650, 'ingredientes': 'Botella de vino tinto o blanco', 'tiempo_preparacion': 2},
            {'nombre': 'Copa de vino tinto/blanco', 'categoria': 'COCTAILS Y VINOS', 'precio': 100, 'ingredientes': 'Copa de vino tinto o blanco', 'tiempo_preparacion': 2},
            
            # EXTRAS
            {'nombre': 'Empaque', 'categoria': 'EXTRAS', 'precio': 35, 'ingredientes': 'Empaque para llevar', 'tiempo_preparacion': 1},
            {'nombre': 'Tostones', 'categoria': 'EXTRAS', 'precio': 60, 'ingredientes': 'Porción de tostones fritos', 'tiempo_preparacion': 5},
            {'nombre': 'Tajadas', 'categoria': 'EXTRAS', 'precio': 60, 'ingredientes': 'Porción de tajadas maduras', 'tiempo_preparacion': 5},
            {'nombre': 'Extra Salsa', 'categoria': 'EXTRAS', 'precio': 85, 'ingredientes': 'Porción adicional de salsa de la casa', 'tiempo_preparacion': 2},
            {'nombre': 'Ensalada Grande', 'categoria': 'EXTRAS', 'precio': 65, 'ingredientes': 'Ensalada fresca grande', 'tiempo_preparacion': 5},
            {'nombre': 'Tortilla', 'categoria': 'EXTRAS', 'precio': 7, 'ingredientes': 'Tortilla de maíz casera', 'tiempo_preparacion': 2},
            {'nombre': 'Tortilla/Queso Sopa', 'categoria': 'EXTRAS', 'precio': 25, 'ingredientes': 'Tortilla con queso para sopa', 'tiempo_preparacion': 2},
            {'nombre': 'Tortilla/Queso G', 'categoria': 'EXTRAS', 'precio': 75, 'ingredientes': 'Tortilla con queso grande', 'tiempo_preparacion': 2},
            {'nombre': 'Queso grande', 'categoria': 'EXTRAS', 'precio': 70, 'ingredientes': 'Porción de queso grande', 'tiempo_preparacion': 1},
            {'nombre': 'Queso Sopero', 'categoria': 'EXTRAS', 'precio': 20, 'ingredientes': 'Porción de queso para sopa', 'tiempo_preparacion': 1},
            {'nombre': 'Arroz', 'categoria': 'EXTRAS', 'precio': 40, 'ingredientes': 'Porción de arroz blanco', 'tiempo_preparacion': 5},
            {'nombre': 'Frijoles/Nachos', 'categoria': 'EXTRAS', 'precio': 85, 'ingredientes': 'Frijoles con nachos', 'tiempo_preparacion': 5},
            {'nombre': 'Pure de papa', 'categoria': 'EXTRAS', 'precio': 70, 'ingredientes': 'Pure de papa cremoso', 'tiempo_preparacion': 5},
            {'nombre': 'Papa campesina', 'categoria': 'EXTRAS', 'precio': 55, 'ingredientes': 'Papas campesinas', 'tiempo_preparacion': 5},
            {'nombre': 'Papa asada', 'categoria': 'EXTRAS', 'precio': 60, 'ingredientes': 'Papa asada al horno', 'tiempo_preparacion': 5},
            {'nombre': 'Papa francesa', 'categoria': 'EXTRAS', 'precio': 60, 'ingredientes': 'Papas fritas estilo francés', 'tiempo_preparacion': 5},
            {'nombre': 'Papa/Horno', 'categoria': 'EXTRAS', 'precio': 60, 'ingredientes': 'Papa horneada con mantequilla', 'tiempo_preparacion': 5},
            {'nombre': 'Cafe', 'categoria': 'EXTRAS', 'precio': 50, 'ingredientes': 'Cafe recien preparado', 'tiempo_preparacion': 4},
            {'nombre': 'Limon', 'categoria': 'EXTRAS', 'precio': 7, 'ingredientes': 'Porción de limón fresco', 'tiempo_preparacion': 1},
            {'nombre': 'Valde', 'categoria': 'EXTRAS', 'precio': 25, 'ingredientes': 'Valde con hielo o bebida', 'tiempo_preparacion': 2},
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
