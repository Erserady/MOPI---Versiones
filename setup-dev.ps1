# Script de configuración inicial para desarrollo local
# Restaurante Don Pepe - MOPI

Write-Host "🚀 Configurando entorno de desarrollo local..." -ForegroundColor Cyan
Write-Host ""

# Verificar si Docker está corriendo
Write-Host "📦 Verificando Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✅ Docker está corriendo" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no está corriendo. Por favor, inicia Docker Desktop." -ForegroundColor Red
    Write-Host "   Descarga: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Crear archivo .env.backend si no existe
if (-not (Test-Path ".env.backend")) {
    Write-Host "📝 Creando archivo .env.backend..." -ForegroundColor Yellow
    Copy-Item ".env.backend.example" ".env.backend"
    Write-Host "✅ Archivo .env.backend creado" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Archivo .env.backend ya existe" -ForegroundColor Blue
}

Write-Host ""

# Preguntar si quiere iniciar el entorno
Write-Host "¿Deseas iniciar el entorno de desarrollo ahora? (S/N)" -ForegroundColor Cyan
$respuesta = Read-Host

if ($respuesta -eq "S" -or $respuesta -eq "s") {
    Write-Host ""
    Write-Host "🚀 Iniciando entorno de desarrollo..." -ForegroundColor Cyan
    Write-Host "   Esto puede tardar varios minutos la primera vez..." -ForegroundColor Yellow
    Write-Host ""
    
    docker-compose up --build
} else {
    Write-Host ""
    Write-Host "✅ Configuración completada" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para iniciar el entorno manualmente, ejecuta:" -ForegroundColor Yellow
    Write-Host "   docker-compose up --build" -ForegroundColor White
    Write-Host ""
    Write-Host "Una vez iniciado, podrás acceder a:" -ForegroundColor Yellow
    Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
    Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
    Write-Host "   Admin:    http://localhost:8000/admin (admin/mopi2024)" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 Lee DESARROLLO_LOCAL.md para más información" -ForegroundColor Cyan
}
