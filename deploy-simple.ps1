# Script ultra-simple para hacer deploy
Write-Host ""
Write-Host "🚀 Deploy Rápido a Render" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Verificar git
if (!(Test-Path ".git")) {
    Write-Host "❌ No es un repositorio git" -ForegroundColor Red
    exit 1
}

# Git add all
Write-Host "📁 Agregando archivos..." -ForegroundColor Yellow
git add .

# Git commit
Write-Host "💾 Creando commit..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
git commit -m "Deploy simplificado - $timestamp"

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  No hay cambios para hacer commit, o error en commit" -ForegroundColor Yellow
}

# Git push
Write-Host "📤 Subiendo a GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al hacer push" -ForegroundColor Red
    Write-Host "Intenta: git push origin master" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ CAMBIOS SUBIDOS!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 SIGUIENTE PASO:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Ve a: https://dashboard.render.com/" -ForegroundColor White
Write-Host "2. Click en 'mopi-backend'" -ForegroundColor White
Write-Host "3. Click en 'Manual Deploy' → 'Deploy latest commit'" -ForegroundColor White
Write-Host "4. Espera 5-10 minutos" -ForegroundColor White
Write-Host "5. Ejecuta: .\test-render-backend.ps1" -ForegroundColor White
Write-Host ""
Write-Host "El build.sh ahora:" -ForegroundColor Yellow
Write-Host "  • Instala dependencias" -ForegroundColor Gray
Write-Host "  • Ejecuta migraciones" -ForegroundColor Gray
Write-Host "  • Recoge archivos estáticos" -ForegroundColor Gray
Write-Host "  • Si NO hay datos: crea usuarios y menú" -ForegroundColor Gray
Write-Host "  • Si YA hay datos: los mantiene intactos" -ForegroundColor Gray
Write-Host ""

Read-Host "Presiona Enter para salir"
