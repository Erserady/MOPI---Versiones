from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from administrador.models import CategoriaMenu, Plato, Inventario
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Popula solo el menú, usuarios básicos e inventario'

    def handle(self, *args, **kwargs):
        self.stdout.write(' Iniciando población del menú...')
        
        # 1. Crear usuarios si no existen
        self.stdout.write('\n Verificando usuarios...')
        
        # Usuario admin
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@restaurant.com',
                'first_name': 'Administrador',
                'last_name': 'Sistema',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'pin': '0000'
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('   Usuario admin creado'))
        else:
            self.stdout.write(self.style.WARNING('   Usuario admin ya existe'))
        
        # Usuario Restaurante
        restaurant_user, created = User.objects.get_or_create(
            username='restaurante',
            defaults={
                'email': 'restaurant@restaurant.com',
                'first_name': 'Restaurante',
                'last_name': 'Don Pepe',
                'role': 'admin',
                'is_staff': True,
                'pin': '1234'
            }
        )
        if created:
            restaurant_user.set_password('restaurante123')
            restaurant_user.save()
            self.stdout.write(self.style.SUCCESS('   Usuario Restaurante creado'))
        else:
            self.stdout.write(self.style.WARNING('   Usuario Restaurante ya existe'))
        
        # 2. Verificar si ya hay menú
        if CategoriaMenu.objects.exists() and Plato.objects.count() > 50:
            self.stdout.write(self.style.WARNING('\n Ya existe un menú completo en la base de datos'))
            self.stdout.write(self.style.WARNING('   Se omitirá la creación del menú'))
            return
        
        self.stdout.write('\n Creando menú completo...')
        self.stdout.write('Este proceso puede tardar un momento...')
        
        # Continúa en la siguiente parte...
        self.stdout.write(self.style.SUCCESS('\n Comando populate_menu cargado'))
