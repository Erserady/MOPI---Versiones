"""
Comando para cargar datos de producción desde production_data.json.
Este comando se ejecuta automáticamente en el primer deploy de Render.
"""
from django.core.management.base import BaseCommand
from django.core.management import call_command
from mesero.models import Table
from administrador.models import Plato, CategoriaMenu
from users.models import User
import os


class Command(BaseCommand):
    help = 'Carga datos de producción si la base de datos está vacía'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('🔍 Verificando si hay datos en la base de datos...'))
        
        # Verificar si ya hay datos
        has_data = (
            Table.objects.exists() or 
            Plato.objects.exists() or 
            CategoriaMenu.objects.exists() or
            User.objects.filter(username='admin').exists()
        )
        
        if has_data:
            self.stdout.write(self.style.SUCCESS('✅ La base de datos ya contiene datos. No se cargarán datos de ejemplo.'))
            return
        
        # Verificar si existe el archivo de datos
        data_file = 'production_data.json'
        if not os.path.exists(data_file):
            self.stdout.write(self.style.WARNING(f'⚠️  Archivo {data_file} no encontrado.'))
            self.stdout.write(self.style.WARNING('   Cargando datos de ejemplo por defecto...'))
            # Cargar datos de ejemplo como fallback
            try:
                call_command('populate_all_data')
                self.stdout.write(self.style.SUCCESS('✅ Datos de ejemplo cargados correctamente'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'❌ Error al cargar datos de ejemplo: {str(e)}'))
            return
        
        # Cargar datos desde el archivo JSON
        self.stdout.write(self.style.WARNING(f'📦 Cargando datos desde {data_file}...'))
        
        try:
            call_command('loaddata', data_file, verbosity=2)
            self.stdout.write(self.style.SUCCESS('\n✅ Datos de producción cargados correctamente'))
            
            # Mostrar estadísticas
            self.stdout.write(self.style.SUCCESS('\n📊 Datos cargados:'))
            self.stdout.write(f'   📁 Categorías: {CategoriaMenu.objects.count()}')
            self.stdout.write(f'   🍽️  Platos: {Plato.objects.count()}')
            self.stdout.write(f'   🪑 Mesas: {Table.objects.count()}')
            self.stdout.write(f'   👥 Usuarios: {User.objects.count()}')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error al cargar datos: {str(e)}'))
            self.stdout.write(self.style.WARNING('   Intentando cargar datos de ejemplo...'))
            try:
                call_command('populate_all_data')
                self.stdout.write(self.style.SUCCESS('✅ Datos de ejemplo cargados como respaldo'))
            except Exception as e2:
                self.stdout.write(self.style.ERROR(f'❌ Error al cargar datos de ejemplo: {str(e2)}'))
