# Script de Instalación Automatizada - MOPI Restaurante Don Pepe
# Este script facilita la instalación para usuarios nuevos

param(
    [string]$MetodoInstalacion = "git"  # "git" o "local"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MOPI - Restaurante Don Pepe" -ForegroundColor Cyan
Write-Host "  Instalación Automatizada" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar requisitos
Write-Host "[1/6] Verificando requisitos..." -ForegroundColor Yellow

# Verificar Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "    ❌ Docker no está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor instala Docker Desktop desde:" -ForegroundColor Yellow
    Write-Host "https://www.docker.com/products/docker-desktop" -ForegroundColor Cyan
    exit 1
}
Write-Host "    ✅ Docker instalado" -ForegroundColor Green

# Verificar que Docker está corriendo
docker ps 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "    ❌ Docker no está corriendo" -ForegroundColor Red
    Write-Host "Por favor inicia Docker Desktop" -ForegroundColor Yellow
    exit 1
}
Write-Host "    ✅ Docker está corriendo" -ForegroundColor Green

# Verificar Git (solo si se usa método git)
if ($MetodoInstalacion -eq "git") {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Host "    ⚠️  Git no está instalado" -ForegroundColor Yellow
        Write-Host "Cambiando a instalación local..." -ForegroundColor Yellow
        $MetodoInstalacion = "local"
    } else {
        Write-Host "    ✅ Git instalado" -ForegroundColor Green
    }
}

Write-Host ""

# 2. Detectar IP local
Write-Host "[2/6] Detectando configuración de red..." -ForegroundColor Yellow
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    ($_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*Ethernet*") -and 
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.*" 
} | Select-Object -First 1).IPAddress

if ($null -eq $ipAddress) {
    Write-Host "    ⚠️  No se detectó IP automáticamente, usando localhost" -ForegroundColor Yellow
    $ipAddress = "localhost"
} else {
    Write-Host "    ✅ IP detectada: $ipAddress" -ForegroundColor Green
}
Write-Host ""

# 3. Descargar o verificar código
Write-Host "[3/6] Obteniendo código fuente..." -ForegroundColor Yellow

if ($MetodoInstalacion -eq "git") {
    if (Test-Path "MOPI---Versiones") {
        Write-Host "    ⚠️  La carpeta ya existe" -ForegroundColor Yellow
        $respuesta = Read-Host "¿Deseas actualizarla? (S/N)"
        if ($respuesta -eq "S" -or $respuesta -eq "s") {
            Set-Location "MOPI---Versiones"
            git pull
            Write-Host "    ✅ Código actualizado" -ForegroundColor Green
        } else {
            Set-Location "MOPI---Versiones"
            Write-Host "    ℹ️  Usando código existente" -ForegroundColor Cyan
        }
    } else {
        git clone https://github.com/Erserady/MOPI---Versiones.git
        if ($LASTEXITCODE -eq 0) {
            Set-Location "MOPI---Versiones"
            Write-Host "    ✅ Código descargado" -ForegroundColor Green
        } else {
            Write-Host "    ❌ Error al clonar repositorio" -ForegroundColor Red
            exit 1
        }
    }
} else {
    # Asumimos que ya estamos en la carpeta correcta
    if (-not (Test-Path "docker-compose.yml")) {
        Write-Host "    ❌ No se encontró docker-compose.yml" -ForegroundColor Red
        Write-Host "Asegúrate de ejecutar este script desde la carpeta del proyecto" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "    ✅ Usando código local" -ForegroundColor Green
}

Write-Host ""

# 4. Configurar docker-compose.yml
Write-Host "[4/6] Configurando para tu red..." -ForegroundColor Yellow

if (Test-Path "docker-compose.yml") {
    $content = Get-Content "docker-compose.yml" -Raw
    
    if ($ipAddress -ne "localhost") {
        $newContent = $content -replace "VITE_API_URL: http://localhost:8000", "VITE_API_URL: http://${ipAddress}:8000"
        $newContent = $newContent -replace "VITE_API_URL: http://192\.168\.\d+\.\d+:8000", "VITE_API_URL: http://${ipAddress}:8000"
        $newContent | Set-Content "docker-compose.yml" -NoNewline
        Write-Host "    ✅ Configurado para IP: $ipAddress" -ForegroundColor Green
    } else {
        Write-Host "    ℹ️  Configurado para localhost" -ForegroundColor Cyan
    }
} else {
    Write-Host "    ❌ No se encontró docker-compose.yml" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 5. Crear archivo .env.backend
Write-Host "[5/6] Creando configuración de entorno..." -ForegroundColor Yellow

$envContent = @"
# Configuración de MOPI - Restaurante Don Pepe
DEBUG=False
SECRET_KEY=$(New-Guid)
DATABASE_URL=postgresql://mopi_user:mopi_pass@db:5432/mopi_db
ALLOWED_HOSTS=localhost,127.0.0.1,$ipAddress
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://${ipAddress}:5173
"@

$envContent | Out-File -FilePath ".env.backend" -Encoding UTF8
Write-Host "    ✅ Archivo .env.backend creado" -ForegroundColor Green
Write-Host ""

# 6. Construir y levantar contenedores
Write-Host "[6/6] Construyendo e iniciando contenedores..." -ForegroundColor Yellow
Write-Host "    Esto puede tomar 5-10 minutos la primera vez..." -ForegroundColor Cyan
Write-Host ""

docker compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "    ✅ Contenedores iniciados correctamente" -ForegroundColor Green
    
    # Esperar un momento para que los servicios estén listos
    Write-Host ""
    Write-Host "Esperando a que los servicios estén listos..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Verificar estado
    Write-Host ""
    Write-Host "Estado de los contenedores:" -ForegroundColor Yellow
    docker compose ps
    
} else {
    Write-Host ""
    Write-Host "    ❌ Error al iniciar contenedores" -ForegroundColor Red
    Write-Host "Revisa los logs con: docker compose logs -f" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Instalación Completada" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Accede a la aplicación en:" -ForegroundColor Yellow
Write-Host ""
if ($ipAddress -ne "localhost") {
    Write-Host "   Desde esta PC:" -ForegroundColor White
    Write-Host "   http://localhost:5173" -ForegroundColor Cyan
    Write-Host "   http://$ipAddress:5173" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Desde otros dispositivos en tu red:" -ForegroundColor White
    Write-Host "   http://$ipAddress:5173" -ForegroundColor Green
} else {
    Write-Host "   http://localhost:5173" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "🔐 Usuarios de prueba (si cargas datos de demostración):" -ForegroundColor Yellow
Write-Host "   Administrador: admin / admin123" -ForegroundColor White
Write-Host "   Caja: caja1 / caja123" -ForegroundColor White
Write-Host "   Cocina: cocina1 / cocina123" -ForegroundColor White
Write-Host ""
Write-Host "📋 Comandos útiles:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Ver logs:" -ForegroundColor White
Write-Host "   docker compose logs -f" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Cargar datos de prueba:" -ForegroundColor White
Write-Host "   docker compose exec backend python manage.py populate_all_data" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Detener contenedores:" -ForegroundColor White
Write-Host "   docker compose stop" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Reiniciar contenedores:" -ForegroundColor White
Write-Host "   docker compose restart" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 Documentación completa: DOCKER_README.md" -ForegroundColor Cyan
Write-Host ""

# Preguntar si desea cargar datos de prueba
Write-Host "¿Deseas cargar datos de demostración? (S/N): " -ForegroundColor Yellow -NoNewline
$cargarDatos = Read-Host

if ($cargarDatos -eq "S" -or $cargarDatos -eq "s") {
    Write-Host ""
    Write-Host "Cargando datos de demostración..." -ForegroundColor Yellow
    docker compose exec backend python manage.py populate_all_data
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Datos de demostración cargados" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Error al cargar datos. Puedes intentarlo manualmente después." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "¡Listo para usar! 🎉" -ForegroundColor Green
Write-Host ""
