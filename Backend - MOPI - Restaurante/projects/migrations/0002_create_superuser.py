# projects/migrations/0002_create_superuser.py
import os
from django.db import migrations
from django.contrib.auth.hashers import make_password

def create_superuser(apps, schema_editor):
    # Usa el modelo histórico dentro de migraciones
    User = apps.get_model('users', 'User')  # <- si tu app label no es 'users', cámbialo aquí
    db_alias = schema_editor.connection.alias

    # Lee las variables de entorno (ya las creaste en Render)
    username = os.environ.get('DJANGO_SUPERUSER_USERNAME')
    email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
    password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

    # Solo crear si las 3 variables están presentes
    if not (username and email and password):
        # No hacemos nada si falta información — esto evita crear cuentas con datos por defecto.
        return

    # Evita duplicados en la base de datos actual
    if not User.objects.using(db_alias).filter(username=username).exists():
        User.objects.using(db_alias).create(
            username=username,
            email=email,
            password=make_password(password),
            is_staff=True,
            is_superuser=True,
        )

def remove_superuser(apps, schema_editor):
    User = apps.get_model('users', 'User')
    db_alias = schema_editor.connection.alias
    username = os.environ.get('DJANGO_SUPERUSER_USERNAME')
    if username:
        User.objects.using(db_alias).filter(username=username).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
        ('projects', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_superuser, remove_superuser),
    ]
