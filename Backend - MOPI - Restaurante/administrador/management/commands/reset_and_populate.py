"""
Comando para resetear completamente la base de datos y poblarla con datos frescos.
Este comando está diseñado para ejecutarse automáticamente en deploys sin interacción humana.
"""
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.contrib.auth import get_user_model
from administrador.models import CategoriaMenu, Plato, Inventario, ConfiguracionSistema
from mesero.models import Table, WaiterOrder
from cocina.models import Order
from caja.models import Caja, Factura
from django.db import transaction
import sys

User = get_user_model()


class Command(BaseCommand):
    help = 'Resetea la base de datos y la puebla con datos frescos (sin interacción)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Forzar el reseteo sin preguntar (para uso en producción)',
        )

    def handle(self, *args, **kwargs):
        force = kwargs.get('force', False)
        
        self.stdout.write("=" * 80)
        self.stdout.write(self.style.WARNING("🔄 RESETEO COMPLETO DE BASE DE DATOS"))
        self.stdout.write("=" * 80)
        self.stdout.write("")
        
        # En producción (Render), siempre forzar
        is_production = '--force' in sys.argv or force
        
        if not is_production:
            self.stdout.write(self.style.WARNING("⚠️  ADVERTENCIA: Esto borrará TODOS los datos existentes."))
            respuesta = input("¿Continuar? (s/n): ")
            if respuesta.lower() != 's':
                self.stdout.write(self.style.ERROR("❌ Operación cancelada"))
                return
        
        try:
            with transaction.atomic():
                self._delete_all_data()
                self._create_users()
                self._create_menu_and_data()
            
            self.stdout.write("")
            self.stdout.write("=" * 80)
            self.stdout.write(self.style.SUCCESS("✅ BASE DE DATOS RESETEADA Y POBLADA EXITOSAMENTE"))
            self.stdout.write("=" * 80)
            self._show_credentials()
            
        except Exception as e:
            self.stdout.write("")
            self.stdout.write(self.style.ERROR(f"❌ ERROR: {str(e)}"))
            import traceback
            self.stdout.write(traceback.format_exc())
            raise

    def _delete_all_data(self):
        """Borra todos los datos de la base de datos"""
        self.stdout.write("")
        self.stdout.write(self.style.WARNING("🗑️  PASO 1: Eliminando datos existentes..."))
        
        # Contar antes de borrar
        counts = {
            'Usuarios': User.objects.count(),
            'Órdenes Mesero': WaiterOrder.objects.count(),
            'Órdenes Cocina': Order.objects.count(),
            'Facturas': Factura.objects.count(),
            'Cajas': Caja.objects.count(),
            'Platos': Plato.objects.count(),
            'Categorías': CategoriaMenu.objects.count(),
            'Mesas': Table.objects.count(),
            'Inventario': Inventario.objects.count(),
        }
        
        for name, count in counts.items():
            if count > 0:
                self.stdout.write(f"   • {name}: {count} registro(s)")
        
        # Borrar en orden correcto (respetando foreign keys)
        WaiterOrder.objects.all().delete()
        Order.objects.all().delete()
        Factura.objects.all().delete()
        Caja.objects.all().delete()
        Plato.objects.all().delete()
        CategoriaMenu.objects.all().delete()
        Table.objects.all().delete()
        Inventario.objects.all().delete()
        ConfiguracionSistema.objects.all().delete()
        User.objects.all().delete()
        
        self.stdout.write(self.style.SUCCESS("   ✅ Todos los datos eliminados"))

    def _create_users(self):
        """Crea usuarios del sistema"""
        self.stdout.write("")
        self.stdout.write(self.style.WARNING("👥 PASO 2: Creando usuarios..."))
        
        # Usuario principal (Restaurante)
        restaurante = User.objects.create_user(
            username='Restaurante',
            email='admin@restaurant.com',
            password='Contraseña123',
            usuario='Restaurante',
            first_name='Admin',
            last_name='Restaurant',
            role='admin',
            pin='0000',
            color='#ef4444'
        )
        restaurante.is_staff = True
        restaurante.is_superuser = True
        restaurante.save()
        self.stdout.write(f"   ✅ Admin: Restaurante (password: Contraseña123, PIN: 0000)")
        
        # Usuario admin temporal
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@mopi.com',
            password='mopi2024',
            usuario='admin',
            first_name='Admin',
            last_name='Temporal'
        )
        admin.role = 'admin'
        admin.pin = '0000'
        admin.color = '#dc2626'
        admin.save()
        self.stdout.write(f"   ✅ Admin: admin (password: mopi2024)")
        
        # Usuarios de cocina
        cocineros = [
            {'username': 'carlos.chef', 'first_name': 'Carlos', 'last_name': 'Rodríguez', 'pin': '1234', 'color': '#10b981'},
            {'username': 'ana.cook', 'first_name': 'Ana', 'last_name': 'García', 'pin': '5678', 'color': '#06b6d4'},
        ]
        
        for data in cocineros:
            User.objects.create_user(
                username=data['username'],
                email=f"{data['username']}@restaurant.com",
                password='password123',
                usuario=data['username'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                role='cook',
                pin=data['pin'],
                color=data['color']
            )
            self.stdout.write(f"   ✅ Cocinero: {data['first_name']} {data['last_name']} (PIN: {data['pin']})")
        
        # Usuarios meseros
        meseros = [
            {'username': 'juan.waiter', 'first_name': 'Juan', 'last_name': 'Pérez', 'pin': '1111', 'color': '#3b82f6'},
            {'username': 'maria.waiter', 'first_name': 'María', 'last_name': 'López', 'pin': '2222', 'color': '#8b5cf6'},
            {'username': 'luis.waiter', 'first_name': 'Luis', 'last_name': 'Martínez', 'pin': '3333', 'color': '#ec4899'},
            {'username': 'sofia.waiter', 'first_name': 'Sofía', 'last_name': 'Hernández', 'pin': '4444', 'color': '#f59e0b'},
        ]
        
        for data in meseros:
            User.objects.create_user(
                username=data['username'],
                email=f"{data['username']}@restaurant.com",
                password='password123',
                usuario=data['username'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                role='waiter',
                pin=data['pin'],
                color=data['color']
            )
            self.stdout.write(f"   ✅ Mesero: {data['first_name']} {data['last_name']} (PIN: {data['pin']})")
        
        # Usuario cajero
        User.objects.create_user(
            username='roberto.cashier',
            email='roberto.cashier@restaurant.com',
            password='password123',
            usuario='roberto.cashier',
            first_name='Roberto',
            last_name='Sánchez',
            role='cashier',
            pin='9999',
            color='#14b8a6'
        )
        self.stdout.write(f"   ✅ Cajero: Roberto Sánchez (PIN: 9999)")
        
        total_users = User.objects.count()
        self.stdout.write(self.style.SUCCESS(f"   ✅ Total usuarios creados: {total_users}"))

    def _create_menu_and_data(self):
        """Crea el menú y datos usando populate_all_data"""
        self.stdout.write("")
        self.stdout.write(self.style.WARNING("🍽️  PASO 3: Creando menú y datos del sistema..."))
        
        # Llamar al comando populate_all_data que ya existe
        call_command('populate_all_data')
        
        # Mostrar estadísticas finales
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("📊 ESTADÍSTICAS FINALES:"))
        self.stdout.write(f"   • Categorías: {CategoriaMenu.objects.count()}")
        self.stdout.write(f"   • Platos: {Plato.objects.count()}")
        self.stdout.write(f"   • Mesas: {Table.objects.count()}")
        self.stdout.write(f"   • Usuarios: {User.objects.count()}")

    def _show_credentials(self):
        """Muestra las credenciales de acceso"""
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("🔑 CREDENCIALES DE ACCESO:"))
        self.stdout.write("")
        self.stdout.write("   👤 Usuario Principal:")
        self.stdout.write("      Username: Restaurante")
        self.stdout.write("      Password: Contraseña123")
        self.stdout.write("      PIN: 0000")
        self.stdout.write("")
        self.stdout.write("   👤 Usuario Admin Temporal:")
        self.stdout.write("      Username: admin")
        self.stdout.write("      Password: mopi2024")
        self.stdout.write("")
        self.stdout.write("   🔢 PINES por Rol:")
        self.stdout.write("      • Admin: 0000")
        self.stdout.write("      • Cocina: 1234, 5678")
        self.stdout.write("      • Meseros: 1111, 2222, 3333, 4444")
        self.stdout.write("      • Cajero: 9999")
        self.stdout.write("")
