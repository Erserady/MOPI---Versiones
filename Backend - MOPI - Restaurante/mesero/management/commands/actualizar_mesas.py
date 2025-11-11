from django.core.management.base import BaseCommand
from mesero.models import Table

class Command(BaseCommand):
    help = 'Actualiza las mesas existentes con los nuevos campos number, capacity y status'

    def handle(self, *args, **options):
        self.stdout.write("🔄 Actualizando mesas existentes...")
        
        mesas_actualizadas = 0
        for mesa in Table.objects.all():
            # Si no tiene number, usar mesa_id o mesa
            if not mesa.number:
                mesa.number = mesa.mesa or mesa.mesa_id
            
            # Si no tiene capacity, poner 4 por defecto
            if not mesa.capacity:
                mesa.capacity = 4
            
            # Si no tiene status, poner available
            if not mesa.status:
                mesa.status = 'available'
            
            mesa.save()
            mesas_actualizadas += 1
            self.stdout.write(f"  ✅ Mesa {mesa.number} actualizada")
        
        self.stdout.write(self.style.SUCCESS(f"\n✅ Total de mesas actualizadas: {mesas_actualizadas}"))
        self.stdout.write(f"📊 Total de mesas en el sistema: {Table.objects.count()}")
