from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Crea usuarios de ejemplo para el sistema de restaurante'

    def handle(self, *args, **kwargs):
        self.stdout.write("🚀 Creando usuarios de ejemplo...")
        
        # Verificar si ya existen usuarios
        if User.objects.exists():
            self.stdout.write(self.style.WARNING('⚠️ Ya existen usuarios en la base de datos'))
            respuesta = input('¿Desea eliminar todos los usuarios y crear nuevos? (s/n): ')
            if respuesta.lower() != 's':
                self.stdout.write(self.style.WARNING('❌ Operación cancelada'))
                return
            User.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('🗑️ Usuarios anteriores eliminados'))
        
        # Crear usuario principal (Restaurante)
        self.stdout.write("\n👤 Creando usuario principal...")
        try:
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
            self.stdout.write(self.style.SUCCESS(f'✅ Admin creado: {restaurante.username} (PIN: 0000)'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error creando admin: {e}'))
            return
        
        # Crear usuarios de cocina
        self.stdout.write("\n👨‍🍳 Creando usuarios de cocina...")
        cocineros_data = [
            {'username': 'carlos.chef', 'first_name': 'Carlos', 'last_name': 'Rodríguez', 'pin': '1234', 'color': '#10b981'},
            {'username': 'ana.cook', 'first_name': 'Ana', 'last_name': 'García', 'pin': '5678', 'color': '#06b6d4'},
        ]
        
        for data in cocineros_data:
            try:
                user = User.objects.create_user(
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
                self.stdout.write(self.style.SUCCESS(f'✅ Cocinero creado: {user.first_name} {user.last_name} (PIN: {data["pin"]})'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'❌ Error: {e}'))
        
        # Crear usuarios meseros
        self.stdout.write("\n🍽️ Creando usuarios meseros...")
        meseros_data = [
            {'username': 'juan.waiter', 'first_name': 'Juan', 'last_name': 'Pérez', 'pin': '1111', 'color': '#3b82f6'},
            {'username': 'maria.waiter', 'first_name': 'María', 'last_name': 'López', 'pin': '2222', 'color': '#8b5cf6'},
            {'username': 'luis.waiter', 'first_name': 'Luis', 'last_name': 'Martínez', 'pin': '3333', 'color': '#ec4899'},
            {'username': 'sofia.waiter', 'first_name': 'Sofía', 'last_name': 'Hernández', 'pin': '4444', 'color': '#f59e0b'},
        ]
        
        for data in meseros_data:
            try:
                user = User.objects.create_user(
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
                self.stdout.write(self.style.SUCCESS(f'✅ Mesero creado: {user.first_name} {user.last_name} (PIN: {data["pin"]})'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'❌ Error: {e}'))
        
        # Crear usuario cajero
        self.stdout.write("\n💰 Creando usuario cajero...")
        try:
            cajero = User.objects.create_user(
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
            self.stdout.write(self.style.SUCCESS(f'✅ Cajero creado: {cajero.first_name} {cajero.last_name} (PIN: 9999)'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error: {e}'))
        
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS("✅ USUARIOS CREADOS EXITOSAMENTE"))
        self.stdout.write("="*60)
        self.stdout.write("\n📋 CREDENCIALES DE ACCESO:")
        self.stdout.write("   Usuario: Restaurante")
        self.stdout.write("   Password: Contraseña123")
        self.stdout.write("\n🔢 PINES DE ACCESO:")
        self.stdout.write("   Admin: 0000")
        self.stdout.write("   Cocina: 1234, 5678")
        self.stdout.write("   Meseros: 1111, 2222, 3333, 4444")
        self.stdout.write("   Cajero: 9999")
        self.stdout.write("\n💡 Siguiente paso: python manage.py populate_all_data\n")
