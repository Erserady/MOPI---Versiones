"""
Comando para cargar datos iniciales de forma segura.
Solo carga datos si las tablas están vacías.
"""
from django.core.management.base import BaseCommand
from mesero.models import Table
from administrador.models import Plato


class Command(BaseCommand):
    help = 'Carga datos iniciales solo si no existen'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('🔍 Verificando datos existentes...'))
        
        # Verificar si ya hay datos (mesas o platos)
        if Table.objects.exists() or Plato.objects.exists():
            self.stdout.write(
                self.style.SUCCESS('✅ Ya existen datos en la base de datos. No se cargan datos de ejemplo.')
            )
            return
        
        # Si no hay datos, cargar datos de ejemplo
        self.stdout.write(self.style.WARNING('📦 Cargando datos iniciales...'))
        
        try:
            # Llamar al comando populate_all_data
            from django.core.management import call_command
            call_command('populate_all_data')
            self.stdout.write(self.style.SUCCESS('✅ Datos iniciales cargados correctamente'))
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error al cargar datos: {str(e)}')
            )
