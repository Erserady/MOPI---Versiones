#!/usr/bin/env bash
# exit on error
set -o errexit

echo "📦 Instalando dependencias..."
pip install -r requirements_updated.txt

echo "🔄 Ejecutando migraciones..."
python manage.py migrate --noinput

echo "📁 Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

echo "🗑️ Reseteando y poblando base de datos..."
python manage.py reset_and_populate --force

echo "✅ Build completado!"