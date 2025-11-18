"""
Comando simple para configurar la aplicación en producción.
Verifica si hay datos, si no los hay, los crea.
"""
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.contrib.auth import get_user_model
from administrador.models import CategoriaMenu, Plato
from mesero.models import Table
import sys

User = get_user_model()


class Command(BaseCommand):
    help = 'Configura la aplicación para producción (solo si está vacía)'

    def handle(self, *args, **kwargs):
        self.stdout.write("")
        self.stdout.write("=" * 80)
        self.stdout.write(self.style.WARNING("🔧 CONFIGURANDO APLICACIÓN PARA PRODUCCIÓN"))
        self.stdout.write("=" * 80)
        self.stdout.write("")
        
        # Verificar si ya hay datos
        has_users = User.objects.exists()
        has_platos = Plato.objects.exists()
        has_mesas = Table.objects.exists()
        
        self.stdout.write("📊 Estado actual de la base de datos:")
        self.stdout.write(f"   Usuarios: {User.objects.count()}")
        self.stdout.write(f"   Platos: {Plato.objects.count()}")
        self.stdout.write(f"   Categorías: {CategoriaMenu.objects.count()}")
        self.stdout.write(f"   Mesas: {Table.objects.count()}")
        self.stdout.write("")
        
        # Si ya hay datos, no hacer nada
        if has_users and has_platos and has_mesas:
            self.stdout.write(self.style.SUCCESS("✅ La aplicación ya está configurada."))
            self.stdout.write(self.style.SUCCESS("✅ Se encontraron datos existentes, no se modificarán."))
            self._show_info()
            return
        
        # Si no hay usuarios, crearlos
        if not has_users:
            self.stdout.write(self.style.WARNING("👥 No hay usuarios, creando..."))
            try:
                self._create_users()
                self.stdout.write(self.style.SUCCESS("✅ Usuarios creados"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ Error creando usuarios: {e}"))
                import traceback
                self.stdout.write(traceback.format_exc())
                return
        else:
            self.stdout.write(self.style.SUCCESS("✅ Usuarios ya existen"))
        
        # Si no hay platos, crearlos
        if not has_platos:
            self.stdout.write(self.style.WARNING("🍽️  No hay platos, poblando menú..."))
            try:
                call_command('populate_all_data')
                self.stdout.write(self.style.SUCCESS("✅ Menú poblado"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ Error poblando menú: {e}"))
                import traceback
                self.stdout.write(traceback.format_exc())
                return
        else:
            self.stdout.write(self.style.SUCCESS("✅ Menú ya existe"))
        
        self.stdout.write("")
        self.stdout.write("=" * 80)
        self.stdout.write(self.style.SUCCESS("✅ CONFIGURACIÓN COMPLETADA EXITOSAMENTE"))
        self.stdout.write("=" * 80)
        
        self._show_info()
    
    def _create_users(self):
        """Crea los usuarios del sistema"""
        
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
        self.stdout.write(f"   ✅ Admin: Restaurante")
        
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
        self.stdout.write(f"   ✅ Admin: admin")
        
        # Cocineros
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
            self.stdout.write(f"   ✅ Cocinero: {data['first_name']}")
        
        # Meseros
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
            self.stdout.write(f"   ✅ Mesero: {data['first_name']}")
        
        # Cajero
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
        self.stdout.write(f"   ✅ Cajero: Roberto")
    
    def _show_info(self):
        """Muestra información de la configuración"""
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("📊 ESTADÍSTICAS FINALES:"))
        self.stdout.write(f"   • Usuarios: {User.objects.count()}")
        self.stdout.write(f"   • Categorías: {CategoriaMenu.objects.count()}")
        self.stdout.write(f"   • Platos: {Plato.objects.count()}")
        self.stdout.write(f"   • Mesas: {Table.objects.count()}")
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("🔑 CREDENCIALES DE ACCESO:"))
        self.stdout.write("   Usuario: Restaurante")
        self.stdout.write("   Password: Contraseña123")
        self.stdout.write("")
        self.stdout.write("   Usuario: admin")
        self.stdout.write("   Password: mopi2024")
        self.stdout.write("")
