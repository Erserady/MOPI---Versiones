"""
Comando para exportar datos de producción (menú, usuarios, mesas).
Uso: python manage.py export_production_data
"""
from django.core.management.base import BaseCommand
from django.core import serializers
from administrador.models import CategoriaMenu, Plato
from mesero.models import Table
from users.models import User
import json


class Command(BaseCommand):
    help = 'Exporta menú, usuarios y mesas a un archivo JSON para producción'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('📦 Exportando datos de producción...'))
        
        data = []
        
        # Exportar categorías del menú
        categorias = CategoriaMenu.objects.all()
        self.stdout.write(f'  📁 Categorías del menú: {categorias.count()}')
        data.extend(json.loads(serializers.serialize('json', categorias)))
        
        # Exportar platos
        platos = Plato.objects.all()
        self.stdout.write(f'  🍽️  Platos: {platos.count()}')
        data.extend(json.loads(serializers.serialize('json', platos)))
        
        # Exportar mesas
        mesas = Table.objects.all()
        self.stdout.write(f'  🪑 Mesas: {mesas.count()}')
        data.extend(json.loads(serializers.serialize('json', mesas)))
        
        # Exportar usuarios
        usuarios = User.objects.all()
        self.stdout.write(f'  👥 Usuarios: {usuarios.count()}')
        data.extend(json.loads(serializers.serialize('json', usuarios)))
        
        # Guardar en archivo
        output_file = 'production_data.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ Datos exportados a: {output_file}'))
        self.stdout.write(self.style.SUCCESS(f'   Total de objetos: {len(data)}'))
        self.stdout.write(self.style.WARNING('\n📋 Siguiente paso:'))
        self.stdout.write('   1. Revisa el archivo production_data.json')
        self.stdout.write('   2. Súbelo a Git: git add production_data.json')
        self.stdout.write('   3. El deploy automático lo cargará en Render')
