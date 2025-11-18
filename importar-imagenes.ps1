# Script para Importar Imágenes Docker
# Importa las imágenes desde archivos .tar

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Importar Imágenes Docker - MOPI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que existan los archivos
$exportFolder = "docker-images-export"

if (-not (Test-Path $exportFolder)) {
    Write-Host "❌ No se encontró la carpeta '$exportFolder'" -ForegroundColor Red
    Write-Host "Asegúrate de extraer el ZIP primero." -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/3] Importando imagen del Backend..." -ForegroundColor Yellow
if (Test-Path "$exportFolder/mopi-backend.tar") {
    docker load -i "$exportFolder/mopi-backend.tar"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ Backend importado correctamente" -ForegroundColor Green
    } else {
        Write-Host "    ❌ Error al importar Backend" -ForegroundColor Red
    }
} else {
    Write-Host "    ❌ No se encontró mopi-backend.tar" -ForegroundColor Red
}

Write-Host ""
Write-Host "[2/3] Importando imagen del Frontend..." -ForegroundColor Yellow
if (Test-Path "$exportFolder/mopi-frontend.tar") {
    docker load -i "$exportFolder/mopi-frontend.tar"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ Frontend importado correctamente" -ForegroundColor Green
    } else {
        Write-Host "    ❌ Error al importar Frontend" -ForegroundColor Red
    }
} else {
    Write-Host "    ❌ No se encontró mopi-frontend.tar" -ForegroundColor Red
}

Write-Host ""
Write-Host "[3/3] Importando imagen de PostgreSQL..." -ForegroundColor Yellow
if (Test-Path "$exportFolder/postgres-16-alpine.tar") {
    docker load -i "$exportFolder/postgres-16-alpine.tar"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ PostgreSQL importado correctamente" -ForegroundColor Green
    } else {
        Write-Host "    ❌ Error al importar PostgreSQL" -ForegroundColor Red
    }
} else {
    Write-Host "    ❌ No se encontró postgres-16-alpine.tar" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Importación Completada" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Imágenes importadas correctamente" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Siguientes pasos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Verifica las imágenes importadas:" -ForegroundColor White
Write-Host "   docker images" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Crea el archivo .env.backend con tus variables:" -ForegroundColor White
Write-Host "   Copia .env.production.example a .env.backend" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Configura tu IP local en docker-compose.yml (línea 55):" -ForegroundColor White
Write-Host "   VITE_API_URL: http://TU_IP:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Levanta los contenedores:" -ForegroundColor White
Write-Host "   docker compose up -d" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. (Opcional) Si es la primera vez, carga datos de prueba:" -ForegroundColor White
Write-Host "   docker compose exec backend python manage.py populate_all_data" -ForegroundColor Cyan
Write-Host ""
