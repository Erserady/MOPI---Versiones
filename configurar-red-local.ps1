# Script de Configuración para Acceso en Red Local
# Restaurante Don Pepe - MOPI

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Configuración de Acceso en Red Local" -ForegroundColor Cyan
Write-Host "   Restaurante Don Pepe - MOPI" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Obtener la IP local
Write-Host "[1/5] Obteniendo IP local..." -ForegroundColor Yellow
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*Ethernet*" } | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } | Select-Object -First 1).IPAddress

if ($null -eq $ipAddress) {
    Write-Host "❌ No se pudo detectar automáticamente tu IP local." -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, ejecuta 'ipconfig' manualmente y busca tu IP." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ IP detectada: $ipAddress" -ForegroundColor Green
Write-Host ""

# 2. Confirmar con el usuario
Write-Host "[2/5] Confirmación" -ForegroundColor Yellow
Write-Host "Se configurará la aplicación para usar la IP: $ipAddress" -ForegroundColor White
$confirmation = Read-Host "¿Es correcta esta IP? (S/N)"

if ($confirmation -ne "S" -and $confirmation -ne "s") {
    $ipAddress = Read-Host "Ingresa tu IP manualmente (ejemplo: 192.168.1.100)"
}

Write-Host ""

# 3. Verificar que docker-compose.yml existe
Write-Host "[3/5] Verificando archivos..." -ForegroundColor Yellow
$dockerComposePath = "docker-compose.yml"

if (-not (Test-Path $dockerComposePath)) {
    Write-Host "❌ No se encontró el archivo docker-compose.yml" -ForegroundColor Red
    Write-Host "Asegúrate de ejecutar este script desde la raíz del proyecto." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Archivo docker-compose.yml encontrado" -ForegroundColor Green
Write-Host ""

# 4. Modificar docker-compose.yml
Write-Host "[4/5] Actualizando docker-compose.yml..." -ForegroundColor Yellow

# Crear backup
$backupPath = "docker-compose.yml.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item $dockerComposePath $backupPath
Write-Host "📁 Backup creado: $backupPath" -ForegroundColor Cyan

# Leer y modificar el contenido
$content = Get-Content $dockerComposePath -Raw
$newContent = $content -replace "VITE_API_URL: http://localhost:8000", "VITE_API_URL: http://${ipAddress}:8000"
$newContent | Set-Content $dockerComposePath -NoNewline

Write-Host "✅ docker-compose.yml actualizado con IP: $ipAddress" -ForegroundColor Green
Write-Host ""

# 5. Configurar firewall
Write-Host "[5/5] Configurando Firewall de Windows..." -ForegroundColor Yellow
Write-Host "⚠️  Se requieren permisos de Administrador para configurar el firewall." -ForegroundColor Yellow
Write-Host ""

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "⚠️  Este script NO se está ejecutando como Administrador." -ForegroundColor Yellow
    Write-Host "No se pueden crear reglas de firewall automáticamente." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opciones:" -ForegroundColor Cyan
    Write-Host "1. Cierra este script y vuelve a ejecutarlo como Administrador (click derecho → Ejecutar como administrador)" -ForegroundColor White
    Write-Host "2. Configura el firewall manualmente (ver GUIA_ACCESO_RED_LOCAL.md)" -ForegroundColor White
    Write-Host ""
} else {
    # Eliminar reglas existentes si existen
    Remove-NetFirewallRule -DisplayName "MOPI Frontend" -ErrorAction SilentlyContinue
    Remove-NetFirewallRule -DisplayName "MOPI Backend" -ErrorAction SilentlyContinue

    # Crear nuevas reglas
    try {
        New-NetFirewallRule -DisplayName "MOPI Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow | Out-Null
        Write-Host "✅ Regla de firewall creada para puerto 5173 (Frontend)" -ForegroundColor Green
        
        New-NetFirewallRule -DisplayName "MOPI Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow | Out-Null
        Write-Host "✅ Regla de firewall creada para puerto 8000 (Backend)" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error al crear reglas de firewall: $_" -ForegroundColor Red
        Write-Host "Configura el firewall manualmente (ver GUIA_ACCESO_RED_LOCAL.md)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Configuración Completada" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Mostrar siguiente paso
Write-Host "📋 Siguientes Pasos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Reconstruye los contenedores:" -ForegroundColor White
Write-Host "   docker compose down" -ForegroundColor Cyan
Write-Host "   docker compose up --build -d" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Accede desde cualquier dispositivo en tu red:" -ForegroundColor White
Write-Host "   Frontend: http://${ipAddress}:5173" -ForegroundColor Green
Write-Host "   Backend:  http://${ipAddress}:8000" -ForegroundColor Green
Write-Host ""

if (-not $isAdmin) {
    Write-Host "⚠️  IMPORTANTE: Configura el firewall manualmente o reejecuta este script como Administrador" -ForegroundColor Yellow
    Write-Host "   Ver: GUIA_ACCESO_RED_LOCAL.md" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "📖 Para más información, consulta: GUIA_ACCESO_RED_LOCAL.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ ¡Listo! Presiona cualquier tecla para salir..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
