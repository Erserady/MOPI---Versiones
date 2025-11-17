#!/bin/bash

# Script de inicio para el contenedor backend Django
set -e

echo "[db] Esperando a que la base de datos esté lista..."
while ! pg_isready -h db -p 5432 -U mopi_user > /dev/null 2>&1; do
    echo "[db] PostgreSQL aún no responde, reintentando en 2s..."
    sleep 2
done

echo "[db] Base de datos disponible."

echo "[init] Ejecutando migraciones..."
python manage.py migrate --noinput

echo "[init] Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

echo "[init] Verificando superusuario..."
python manage.py shell << END
from django.contrib.auth import get_user_model
import os
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(
        username='admin',
        email=os.environ.get('ADMIN_EMAIL', 'admin@mopi.com'),
        password=os.environ.get('ADMIN_PASSWORD', 'mopi2024')
    )
    print("[superuser] ✅ Superusuario creado (admin/mopi2024)")
else:
    print("[superuser] ℹ️ Superusuario ya existe")
END

echo "[init] Verificando datos iniciales..."
python manage.py setup_initial_data

echo "[gunicorn] Iniciando servidor..."
exec gunicorn drfsimplecrud.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --threads 2 \
    --timeout 60 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
