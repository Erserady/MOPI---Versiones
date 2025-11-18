# Script para hacer commit y push de los cambios que solucionan el problema de Render
# Uso: .\deploy-fix-render.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 DEPLOY DE CORRECCIONES A RENDER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si estamos en un repositorio git
if (!(Test-Path ".git")) {
    Write-Host "❌ Error: No se detectó un repositorio git en este directorio" -ForegroundColor Red
    Write-Host "   Asegúrate de estar en: d:\ULSA\MOPI" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Archivos modificados:" -ForegroundColor Yellow
Write-Host "  1. Backend - MOPI - Restaurante/docker/entrypoint.sh" -ForegroundColor White
Write-Host "  2. Backend - MOPI - Restaurante/administrador/management/commands/load_production_data.py" -ForegroundColor White
Write-Host ""

# Mostrar el estado actual de git
Write-Host "📊 Estado actual del repositorio:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Preguntar confirmación
Write-Host "¿Deseas continuar con el commit y push? (S/N): " -ForegroundColor Yellow -NoNewline
$confirmation = Read-Host

if ($confirmation -ne "S" -and $confirmation -ne "s") {
    Write-Host "❌ Operación cancelada por el usuario" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "➜ Agregando archivos al staging..." -ForegroundColor Cyan

# Agregar los archivos modificados
git add "Backend - MOPI - Restaurante/docker/entrypoint.sh"
git add "Backend - MOPI - Restaurante/administrador/management/commands/load_production_data.py"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al agregar archivos" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Archivos agregados" -ForegroundColor Green
Write-Host ""

# Hacer commit
Write-Host "➜ Creando commit..." -ForegroundColor Cyan
$commitMessage = "Fix: Corregir orden de carga de datos en producción

- Cambiar orden en entrypoint.sh: cargar production_data.json antes de crear admin
- Remover verificación de usuario admin en load_production_data.py
- Esto permite que los datos se carguen correctamente en el primer deploy
- Soluciona: No se cargaban usuarios (Restaurante) ni datos del menú"

git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al crear commit" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Commit creado exitosamente" -ForegroundColor Green
Write-Host ""

# Push a origin
Write-Host "➜ Haciendo push a origin..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "⚠️  El push falló. Intentando con 'master'..." -ForegroundColor Yellow
    git push origin master
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error al hacer push" -ForegroundColor Red
        Write-Host ""
        Write-Host "Intenta manualmente:" -ForegroundColor Yellow
        Write-Host "  git push origin main" -ForegroundColor White
        Write-Host "  o" -ForegroundColor Gray
        Write-Host "  git push origin master" -ForegroundColor White
        exit 1
    }
}

Write-Host "✅ Push exitoso!" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ CAMBIOS SUBIDOS EXITOSAMENTE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 SIGUIENTES PASOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Ir a Render Dashboard:" -ForegroundColor White
Write-Host "   https://dashboard.render.com/" -ForegroundColor Cyan
Write-Host ""
Write-Host "2️⃣  OPCIÓN A - Borrar y recrear BD (Recomendado):" -ForegroundColor White
Write-Host "   a. Ve a Databases → mopi-database" -ForegroundColor Gray
Write-Host "   b. Settings → Delete Database" -ForegroundColor Gray
Write-Host "   c. Confirma la eliminación" -ForegroundColor Gray
Write-Host "   d. Espera a que se recree automáticamente" -ForegroundColor Gray
Write-Host "   e. Ve a Web Services → mopi-backend" -ForegroundColor Gray
Write-Host "   f. Manual Deploy → Deploy latest commit" -ForegroundColor Gray
Write-Host ""
Write-Host "   OPCIÓN B - Solo redeploy (si la BD ya está vacía):" -ForegroundColor White
Write-Host "   a. Ve a Web Services → mopi-backend" -ForegroundColor Gray
Write-Host "   b. Manual Deploy → Deploy latest commit" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Esperar 5-10 minutos a que termine el deploy" -ForegroundColor White
Write-Host ""
Write-Host "4️⃣  Ejecutar script de pruebas:" -ForegroundColor White
Write-Host "   .\test-render-backend.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "5️⃣  Revisar los logs en Render para confirmar que aparece:" -ForegroundColor White
Write-Host "   '[init] Cargando datos de producción...'" -ForegroundColor Gray
Write-Host "   '📦 Cargando datos desde production_data.json...'" -ForegroundColor Gray
Write-Host "   '✅ Datos de producción cargados correctamente'" -ForegroundColor Gray
Write-Host ""

Write-Host "📖 Para más detalles, consulta: SOLUCION_RENDER.md" -ForegroundColor Yellow
Write-Host ""

Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
