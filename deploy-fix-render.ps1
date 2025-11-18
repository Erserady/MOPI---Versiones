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

Write-Host "📋 Archivos modificados/nuevos:" -ForegroundColor Yellow
Write-Host "  1. Backend - MOPI - Restaurante/administrador/management/commands/reset_and_populate.py (NUEVO)" -ForegroundColor White
Write-Host "  2. Backend - MOPI - Restaurante/build.sh" -ForegroundColor White
Write-Host "  3. render.yaml" -ForegroundColor White
Write-Host "  4. Backend - MOPI - Restaurante/docker/entrypoint.sh" -ForegroundColor White
Write-Host "  5. Backend - MOPI - Restaurante/administrador/management/commands/load_production_data.py" -ForegroundColor White
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

# Agregar los archivos modificados y nuevos
git add "Backend - MOPI - Restaurante/administrador/management/commands/reset_and_populate.py"
git add "Backend - MOPI - Restaurante/build.sh"
git add render.yaml
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
$commitMessage = "Fix: Implementar reseteo automático de BD en cada deploy

- Nuevo comando: reset_and_populate.py que borra y recrea todos los datos
- Actualizar build.sh para ejecutar reset_and_populate en cada deploy
- Actualizar render.yaml para usar build.sh en buildCommand
- Usar populate_all_data.py para cargar menú completo con todos los platos
- Soluciona: Datos no se cargaban correctamente en producción"

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
Write-Host "2️⃣  Redeploy del Backend:" -ForegroundColor White
Write-Host "   a. Ve a Web Services → mopi-backend" -ForegroundColor Gray
Write-Host "   b. Manual Deploy → Deploy latest commit" -ForegroundColor Gray
Write-Host ""
Write-Host "   ℹ️  El build.sh se encargará automáticamente de:" -ForegroundColor Cyan
Write-Host "      • Instalar dependencias" -ForegroundColor Gray
Write-Host "      • Ejecutar migraciones" -ForegroundColor Gray
Write-Host "      • Borrar TODOS los datos existentes" -ForegroundColor Gray
Write-Host "      • Crear usuarios frescos (Restaurante, admin, meseros, etc.)" -ForegroundColor Gray
Write-Host "      • Cargar el menú completo con populate_all_data" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Esperar 5-10 minutos a que termine el deploy" -ForegroundColor White
Write-Host ""
Write-Host "4️⃣  Ejecutar script de pruebas:" -ForegroundColor White
Write-Host "   .\test-render-backend.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "5️⃣  Revisar los logs en Render para confirmar que aparece:" -ForegroundColor White
Write-Host "   '🗑️ Reseteando y poblando base de datos...'" -ForegroundColor Gray
Write-Host "   '🗑️  PASO 1: Eliminando datos existentes...'" -ForegroundColor Gray
Write-Host "   '👥 PASO 2: Creando usuarios...'" -ForegroundColor Gray
Write-Host "   '🍽️  PASO 3: Creando menú y datos del sistema...'" -ForegroundColor Gray
Write-Host "   '✅ BASE DE DATOS RESETEADA Y POBLADA EXITOSAMENTE'" -ForegroundColor Gray
Write-Host ""

Write-Host "📖 Para más detalles, consulta: SOLUCION_RENDER.md" -ForegroundColor Yellow
Write-Host ""

Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
