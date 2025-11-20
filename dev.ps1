# Script de comandos útiles para desarrollo - Restaurante Don Pepe
# Uso: .\dev.ps1 [comando]

param(
    [Parameter(Position=0)]
    [string]$comando = "help"
)

function Show-Help {
    Write-Host ""
    Write-Host "🛠️  Comandos de desarrollo disponibles:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  .\dev.ps1 start          " -NoNewline -ForegroundColor Yellow
    Write-Host "- Iniciar el entorno completo"
    Write-Host "  .\dev.ps1 stop           " -NoNewline -ForegroundColor Yellow
    Write-Host "- Detener el entorno"
    Write-Host "  .\dev.ps1 restart        " -NoNewline -ForegroundColor Yellow
    Write-Host "- Reiniciar el entorno"
    Write-Host "  .\dev.ps1 rebuild        " -NoNewline -ForegroundColor Yellow
    Write-Host "- Reconstruir e iniciar"
    Write-Host "  .\dev.ps1 logs           " -NoNewline -ForegroundColor Yellow
    Write-Host "- Ver logs de todos los servicios"
    Write-Host "  .\dev.ps1 logs-backend   " -NoNewline -ForegroundColor Yellow
    Write-Host "- Ver logs del backend"
    Write-Host "  .\dev.ps1 logs-frontend  " -NoNewline -ForegroundColor Yellow
    Write-Host "- Ver logs del frontend"
    Write-Host "  .\dev.ps1 shell          " -NoNewline -ForegroundColor Yellow
    Write-Host "- Abrir shell de Django"
    Write-Host "  .\dev.ps1 migrate        " -NoNewline -ForegroundColor Yellow
    Write-Host "- Crear y aplicar migraciones"
    Write-Host "  .\dev.ps1 clean          " -NoNewline -ForegroundColor Yellow
    Write-Host "- Limpiar completamente (⚠️  borra datos)"
    Write-Host "  .\dev.ps1 status         " -NoNewline -ForegroundColor Yellow
    Write-Host "- Ver estado de contenedores"
    Write-Host "  .\dev.ps1 deploy         " -NoNewline -ForegroundColor Yellow
    Write-Host "- Desplegar a Fly.io"
    Write-Host ""
}

switch ($comando.ToLower()) {
    "start" {
        Write-Host "🚀 Iniciando entorno de desarrollo..." -ForegroundColor Green
        docker-compose up
    }
    "stop" {
        Write-Host "🛑 Deteniendo entorno..." -ForegroundColor Yellow
        docker-compose down
    }
    "restart" {
        Write-Host "🔄 Reiniciando entorno..." -ForegroundColor Yellow
        docker-compose restart
    }
    "rebuild" {
        Write-Host "🔨 Reconstruyendo e iniciando..." -ForegroundColor Yellow
        docker-compose up --build
    }
    "logs" {
        Write-Host "📋 Mostrando logs..." -ForegroundColor Cyan
        docker-compose logs -f
    }
    "logs-backend" {
        Write-Host "📋 Mostrando logs del backend..." -ForegroundColor Cyan
        docker-compose logs -f backend
    }
    "logs-frontend" {
        Write-Host "📋 Mostrando logs del frontend..." -ForegroundColor Cyan
        docker-compose logs -f frontend
    }
    "shell" {
        Write-Host "🐚 Abriendo Django shell..." -ForegroundColor Cyan
        docker-compose exec backend python manage.py shell
    }
    "migrate" {
        Write-Host "📊 Creando migraciones..." -ForegroundColor Cyan
        docker-compose exec backend python manage.py makemigrations
        Write-Host "📊 Aplicando migraciones..." -ForegroundColor Cyan
        docker-compose exec backend python manage.py migrate
    }
    "clean" {
        Write-Host "⚠️  ADVERTENCIA: Esto eliminará todos los datos locales" -ForegroundColor Red
        Write-Host "¿Estás seguro? (S/N)" -ForegroundColor Yellow
        $confirmacion = Read-Host
        if ($confirmacion -eq "S" -or $confirmacion -eq "s") {
            Write-Host "🧹 Limpiando entorno..." -ForegroundColor Yellow
            docker-compose down -v
            docker system prune -f
            Write-Host "✅ Entorno limpio. Ejecuta '.\dev.ps1 rebuild' para iniciar de nuevo." -ForegroundColor Green
        } else {
            Write-Host "❌ Operación cancelada" -ForegroundColor Red
        }
    }
    "status" {
        Write-Host "📊 Estado de contenedores:" -ForegroundColor Cyan
        docker-compose ps
    }
    "deploy" {
        Write-Host "🚀 Desplegando a Fly.io..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📦 Desplegando backend..." -ForegroundColor Yellow
        Set-Location "Backend - MOPI - Restaurante"
        flyctl deploy --config fly.toml
        Set-Location ..
        Write-Host ""
        Write-Host "🎨 Desplegando frontend..." -ForegroundColor Yellow
        Set-Location "Restaurant-DonPepe-main\RestaurantSoft-main\Frontend"
        flyctl deploy --config fly.toml
        Set-Location ..\..\..
        Write-Host ""
        Write-Host "✅ Deployment completado" -ForegroundColor Green
        Write-Host "   Backend:  https://mopi.fly.dev" -ForegroundColor White
        Write-Host "   Frontend: https://mopi-frontend.fly.dev" -ForegroundColor White
    }
    default {
        Show-Help
    }
}
