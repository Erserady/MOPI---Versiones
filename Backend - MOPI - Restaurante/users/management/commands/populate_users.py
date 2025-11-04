from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Popula la base de datos con usuarios de prueba'

    def handle(self, *args, **kwargs):
        self.stdout.write("Iniciando población de usuarios...")
        
        users_data = [
            # Usuario principal del sistema (para login inicial)
            {
                'username': 'Restaurante',
                'password': 'Contraseña123',
                'email': 'sistema@donpepe.com',
                'first_name': 'Sistema',
                'last_name': 'Restaurante',
                'usuario': 'Restaurante',
                'role': 'admin',
                'pin': '',  # No necesita PIN porque es el usuario del login
                'color': '#1b7b3f',
                'is_staff': True,
                'is_superuser': True
            },
            # Cocina (solo necesitan PIN, no username/password)
            {
                'username': 'carlos.mendez',
                'password': 'temp_password_not_used',
                'email': 'carlos.mendez@donpepe.com',
                'first_name': 'Carlos',
                'last_name': 'Méndez',
                'usuario': 'carlos.mendez',
                'role': 'cook',
                'pin': '1234',
                'color': '#e74c3c'
            },
            {
                'username': 'ana.torres',
                'password': 'temp_password_not_used',
                'email': 'ana.torres@donpepe.com',
                'first_name': 'Ana',
                'last_name': 'Torres',
                'usuario': 'ana.torres',
                'role': 'cook',
                'pin': '5678',
                'color': '#9b59b6'
            },
            # Meseros
            {
                'username': 'juan.perez',
                'password': 'temp_password_not_used',
                'email': 'juan.perez@donpepe.com',
                'first_name': 'Juan',
                'last_name': 'Pérez',
                'usuario': 'juan.perez',
                'role': 'waiter',
                'pin': '1111',
                'color': '#3498db'
            },
            {
                'username': 'maria.garcia',
                'password': 'temp_password_not_used',
                'email': 'maria.garcia@donpepe.com',
                'first_name': 'María',
                'last_name': 'García',
                'usuario': 'maria.garcia',
                'role': 'waiter',
                'pin': '2222',
                'color': '#2ecc71'
            },
            {
                'username': 'luis.ramirez',
                'password': 'temp_password_not_used',
                'email': 'luis.ramirez@donpepe.com',
                'first_name': 'Luis',
                'last_name': 'Ramírez',
                'usuario': 'luis.ramirez',
                'role': 'waiter',
                'pin': '3333',
                'color': '#f39c12'
            },
            {
                'username': 'sofia.lopez',
                'password': 'temp_password_not_used',
                'email': 'sofia.lopez@donpepe.com',
                'first_name': 'Sofía',
                'last_name': 'López',
                'usuario': 'sofia.lopez',
                'role': 'waiter',
                'pin': '4444',
                'color': '#1abc9c'
            },
            # Caja
            {
                'username': 'roberto.diaz',
                'password': 'temp_password_not_used',
                'email': 'roberto.diaz@donpepe.com',
                'first_name': 'Roberto',
                'last_name': 'Díaz',
                'usuario': 'roberto.diaz',
                'role': 'cashier',
                'pin': '9999',
                'color': '#34495e'
            },
            # Administrador
            {
                'username': 'administrador',
                'password': 'temp_password_not_used',
                'email': 'admin@donpepe.com',
                'first_name': 'Administrador',
                'last_name': '',
                'usuario': 'administrador',
                'role': 'admin',
                'pin': '0000',
                'color': '#c0392b',
                'is_staff': False,
                'is_superuser': False
            },
        ]
        
        created_count = 0
        updated_count = 0
        
        for user_data in users_data:
            is_staff = user_data.pop('is_staff', False)
            is_superuser = user_data.pop('is_superuser', False)
            password = user_data.pop('password')
            username = user_data.get('username')
            
            # Verificar si el usuario ya existe
            if User.objects.filter(username=username).exists():
                user = User.objects.get(username=username)
                # Actualizar los campos
                for key, value in user_data.items():
                    setattr(user, key, value)
                user.set_password(password)
                user.is_staff = is_staff
                user.is_superuser = is_superuser
                user.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Usuario actualizado: {user.username} ({user.get_role_display()})')
                )
            else:
                # Crear nuevo usuario
                user = User.objects.create_user(**user_data, password=password)
                user.is_staff = is_staff
                user.is_superuser = is_superuser
                user.save()
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Usuario creado: {user.username} ({user.get_role_display()})')
                )
        
        self.stdout.write(self.style.SUCCESS('\n✅ Base de datos populada exitosamente'))
        self.stdout.write(self.style.SUCCESS(f'\n📊 Estadísticas:'))
        self.stdout.write(f'   - Usuarios creados: {created_count}')
        self.stdout.write(f'   - Usuarios actualizados: {updated_count}')
        self.stdout.write(self.style.SUCCESS('\n🔑 Credenciales de Login:'))
        self.stdout.write('   - Usuario: Restaurante')
        self.stdout.write('   - Contraseña: Contraseña123')
        self.stdout.write(self.style.SUCCESS('\n📌 PINs de usuarios por rol:'))
        self.stdout.write('   Cocina:')
        self.stdout.write('     • Carlos Méndez: 1234')
        self.stdout.write('     • Ana Torres: 5678')
        self.stdout.write('   Meseros:')
        self.stdout.write('     • Juan Pérez: 1111')
        self.stdout.write('     • María García: 2222')
        self.stdout.write('     • Luis Ramírez: 3333')
        self.stdout.write('     • Sofía López: 4444')
        self.stdout.write('   Caja:')
        self.stdout.write('     • Roberto Díaz: 9999')
        self.stdout.write('   Administrador:')
        self.stdout.write('     • Administrador: 0000')
