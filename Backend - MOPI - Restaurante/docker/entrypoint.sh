#!/bin/bash

# Script de inicio para el contenedor backend Django
set -e

# Verificar si existe el host 'db' (Docker Compose local)
# Si no existe, asumimos que estamos en producción
if ping -c 1 -W 1 db &> /dev/null; then
    # Estamos en desarrollo local con Docker Compose
    echo "[db] Entorno de desarrollo detectado. Esperando a PostgreSQL local..."
    while ! pg_isready -h db -p 5432 -U mopi_user > /dev/null 2>&1; do
        echo "[db] PostgreSQL local aún no responde, reintentando en 2s..."
        sleep 2
    done
    echo "[db] Base de datos local disponible."
else
    # Estamos en producción (Render, AWS, etc.)
    echo "[db] Entorno de producción detectado."
    echo "[db] Usando DATABASE_URL para conexión remota."
fi

echo "[init] Ejecutando migraciones..."
python manage.py migrate --noinput

echo "[init] Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

echo "[init] Cargando datos de producción..."
python manage.py load_production_data

echo "[init] Verificando superusuario (fallback)..."
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

echo "[gunicorn] Iniciando servidor..."
exec gunicorn drfsimplecrud.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --threads 2 \
    --timeout 60 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
