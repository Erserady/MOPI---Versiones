# Script PowerShell para gestionar el stack Docker de MOPI
# Uso: .\docker-start.ps1 [comando]

param(
    [Parameter(Position=0)]
    [ValidateSet('up', 'down', 'restart', 'logs', 'status', 'clean', 'backup', 'help')]
    [string]$Command = 'help'
)

$ErrorActionPreference = "Stop"

function Show-Header {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "   🐳 MOPI Docker Manager" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Show-Help {
    Show-Header
    Write-Host "Comandos disponibles:`n" -ForegroundColor Yellow
    Write-Host "  up       - Construir y levantar todos los servicios" -ForegroundColor White
    Write-Host "  down     - Detener todos los servicios" -ForegroundColor White
    Write-Host "  restart  - Reiniciar todos los servicios" -ForegroundColor White
    Write-Host "  logs     - Ver logs en tiempo real" -ForegroundColor White
    Write-Host "  status   - Ver estado de los contenedores" -ForegroundColor White
    Write-Host "  clean    - Limpiar todo (contenedores, volúmenes, imágenes)" -ForegroundColor White
    Write-Host "  backup   - Hacer backup de la base de datos" -ForegroundColor White
    Write-Host "  help     - Mostrar esta ayuda`n" -ForegroundColor White
    
    Write-Host "Ejemplos:" -ForegroundColor Yellow
    Write-Host "  .\docker-start.ps1 up" -ForegroundColor Gray
    Write-Host "  .\docker-start.ps1 logs" -ForegroundColor Gray
    Write-Host "  .\docker-start.ps1 status`n" -ForegroundColor Gray
}

function Start-Services {
    Show-Header
    Write-Host "🚀 Construyendo y levantando servicios...`n" -ForegroundColor Green
    docker compose up --build -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Servicios iniciados correctamente!`n" -ForegroundColor Green
        Write-Host "Accede a:" -ForegroundColor Yellow
        Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor Cyan
        Write-Host "  Backend:   http://localhost:8000" -ForegroundColor Cyan
        Write-Host "  Admin:     http://localhost:8000/admin`n" -ForegroundColor Cyan
    } else {
        Write-Host "`n❌ Error al iniciar servicios" -ForegroundColor Red
        exit 1
    }
}

function Stop-Services {
    Show-Header
    Write-Host "🛑 Deteniendo servicios...`n" -ForegroundColor Yellow
    docker compose down
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Servicios detenidos correctamente!`n" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Error al detener servicios" -ForegroundColor Red
        exit 1
    }
}

function Restart-Services {
    Show-Header
    Write-Host "🔄 Reiniciando servicios...`n" -ForegroundColor Yellow
    docker compose restart
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Servicios reiniciados correctamente!`n" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Error al reiniciar servicios" -ForegroundColor Red
        exit 1
    }
}

function Show-Logs {
    Show-Header
    Write-Host "📋 Mostrando logs (Ctrl+C para salir)...`n" -ForegroundColor Yellow
    docker compose logs -f
}

function Show-Status {
    Show-Header
    Write-Host "📊 Estado de los contenedores:`n" -ForegroundColor Yellow
    docker compose ps
    Write-Host ""
}

function Clean-All {
    Show-Header
    Write-Host "⚠️  ADVERTENCIA: Esto eliminará TODOS los datos!`n" -ForegroundColor Red
    $confirmation = Read-Host "¿Estás seguro? Escribe 'SI' para continuar"
    
    if ($confirmation -eq 'SI') {
        Write-Host "`n🧹 Limpiando todo...`n" -ForegroundColor Yellow
        docker compose down -v
        docker compose rm -f
        docker rmi mopi_backend mopi_frontend -f 2>$null
        Write-Host "`n✅ Limpieza completada!`n" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Operación cancelada`n" -ForegroundColor Yellow
    }
}

function Backup-Database {
    Show-Header
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "backup_$timestamp.sql"
    
    Write-Host "💾 Creando backup de la base de datos...`n" -ForegroundColor Yellow
    docker compose exec -T db pg_dump -U mopi_user mopi_db > $backupFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Backup creado: $backupFile`n" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Error al crear backup" -ForegroundColor Red
        exit 1
    }
}

# Ejecutar comando
switch ($Command) {
    'up'      { Start-Services }
    'down'    { Stop-Services }
    'restart' { Restart-Services }
    'logs'    { Show-Logs }
    'status'  { Show-Status }
    'clean'   { Clean-All }
    'backup'  { Backup-Database }
    'help'    { Show-Help }
    default   { Show-Help }
}
