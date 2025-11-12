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

cat <<'EOF'
[info] populate_all_data ya no se ejecuta automáticamente.
[info] Si necesitas datos de demostración, corre:
[info]     docker compose exec backend python manage.py populate_all_data
EOF

echo "[gunicorn] Iniciando servidor..."
exec gunicorn drfsimplecrud.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --threads 2 \
    --timeout 60 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
