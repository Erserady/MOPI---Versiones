#!/bin/bash

# Script de inicio para el contenedor backend Django
set -e

echo "🔍 Esperando a que la base de datos esté lista..."
# Esperar a que PostgreSQL esté disponible
while ! pg_isready -h db -p 5432 -U mopi_user > /dev/null 2>&1; do
    echo "⏳ Esperando a PostgreSQL..."
    sleep 2
done

echo "✅ Base de datos disponible!"

echo "🔄 Ejecutando migraciones..."
python manage.py migrate --noinput

echo "📦 Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

echo "🌱 Cargando datos iniciales..."
python manage.py populate_all_data || echo "⚠️ Advertencia: populate_all_data falló o los datos ya existen"

echo "🚀 Iniciando servidor Gunicorn..."
exec gunicorn drfsimplecrud.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --threads 2 \
    --timeout 60 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
