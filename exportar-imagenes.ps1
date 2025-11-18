# Script para Exportar Imágenes Docker
# Crea archivos .tar que puedes compartir con otros

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Exportar Imágenes Docker - MOPI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Crear carpeta de exportación
$exportFolder = "docker-images-export"
if (-not (Test-Path $exportFolder)) {
    New-Item -ItemType Directory -Path $exportFolder | Out-Null
}

Write-Host "[1/3] Exportando imagen del Backend..." -ForegroundColor Yellow
docker save -o "$exportFolder/mopi-backend.tar" mopi-backend
if ($LASTEXITCODE -eq 0) {
    $size = (Get-Item "$exportFolder/mopi-backend.tar").Length / 1MB
    Write-Host "    ✅ Backend exportado: mopi-backend.tar ($([math]::Round($size, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "    ❌ Error al exportar Backend" -ForegroundColor Red
}

Write-Host ""
Write-Host "[2/3] Exportando imagen del Frontend..." -ForegroundColor Yellow
docker save -o "$exportFolder/mopi-frontend.tar" mopi-frontend
if ($LASTEXITCODE -eq 0) {
    $size = (Get-Item "$exportFolder/mopi-frontend.tar").Length / 1MB
    Write-Host "    ✅ Frontend exportado: mopi-frontend.tar ($([math]::Round($size, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "    ❌ Error al exportar Frontend" -ForegroundColor Red
}

Write-Host ""
Write-Host "[3/3] Exportando imagen de PostgreSQL..." -ForegroundColor Yellow
docker save -o "$exportFolder/postgres-16-alpine.tar" postgres:16-alpine
if ($LASTEXITCODE -eq 0) {
    $size = (Get-Item "$exportFolder/postgres-16-alpine.tar").Length / 1MB
    Write-Host "    ✅ PostgreSQL exportado: postgres-16-alpine.tar ($([math]::Round($size, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "    ❌ Error al exportar PostgreSQL" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Copiar archivos necesarios
Write-Host ""
Write-Host "Copiando archivos de configuración..." -ForegroundColor Yellow
Copy-Item "docker-compose.yml" "$exportFolder/"
Copy-Item ".env.production.example" "$exportFolder/" -ErrorAction SilentlyContinue
Copy-Item "DOCKER_README.md" "$exportFolder/"
Copy-Item "GUIA_ACCESO_RED_LOCAL.md" "$exportFolder/"
Write-Host "✅ Archivos copiados" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Exportación Completada" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📁 Archivos exportados en: $exportFolder\" -ForegroundColor White
Write-Host ""
Write-Host "Tamaño total aproximado:" -ForegroundColor Yellow
$totalSize = (Get-ChildItem $exportFolder -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "   $([math]::Round($totalSize, 2)) MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "📤 Para compartir:" -ForegroundColor Yellow
Write-Host "   1. Comprime la carpeta '$exportFolder' a ZIP" -ForegroundColor White
Write-Host "   2. Comparte el archivo ZIP con la otra persona" -ForegroundColor White
Write-Host "   3. La otra persona debe ejecutar 'importar-imagenes.ps1'" -ForegroundColor White
Write-Host ""
