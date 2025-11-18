#!/usr/bin/env bash
# exit on error
set -o errexit

echo "====================================="
echo "🚀 Build MOPI Backend"
echo "====================================="

echo ""
echo "📦 Instalando dependencias..."
pip install -r requirements_updated.txt

echo ""
echo "🔄 Ejecutando migraciones..."
python manage.py migrate --noinput

echo ""
echo "📁 Recolectando archivos estáticos..."
python manage.py collectstatic --noinput --clear

echo ""
echo "🔧 Configurando aplicación..."
python manage.py setup_production

echo ""
echo "====================================="
echo "✅ Build completado!"
echo "====================================="