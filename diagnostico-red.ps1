# Script de Diagnóstico de Red
# Para identificar problemas de acceso desde dispositivos móviles

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Diagnóstico de Red - MOPI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar IP actual
Write-Host "[1] Tu IP actual:" -ForegroundColor Yellow
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*Ethernet*" } | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } | Select-Object -First 1).IPAddress
Write-Host "    $ipAddress" -ForegroundColor Green
Write-Host ""

# 2. Verificar puertos
Write-Host "[2] Verificando puertos abiertos:" -ForegroundColor Yellow
$port5173 = netstat -ano | findstr ":5173" | findstr "0.0.0.0" | Select-Object -First 1
$port8000 = netstat -ano | findstr ":8000" | findstr "0.0.0.0" | Select-Object -First 1

if ($port5173) {
    Write-Host "    ✅ Puerto 5173 (Frontend) está abierto" -ForegroundColor Green
} else {
    Write-Host "    ❌ Puerto 5173 (Frontend) NO está abierto" -ForegroundColor Red
}

if ($port8000) {
    Write-Host "    ✅ Puerto 8000 (Backend) está abierto" -ForegroundColor Green
} else {
    Write-Host "    ❌ Puerto 8000 (Backend) NO está abierto" -ForegroundColor Red
}
Write-Host ""

# 3. Verificar reglas de firewall
Write-Host "[3] Verificando reglas de firewall:" -ForegroundColor Yellow
$frontendRule = Get-NetFirewallRule -DisplayName "MOPI Frontend" -ErrorAction SilentlyContinue
$backendRule = Get-NetFirewallRule -DisplayName "MOPI Backend" -ErrorAction SilentlyContinue

if ($frontendRule -and $frontendRule.Enabled -eq $true) {
    Write-Host "    ✅ Regla de firewall para Frontend está activa" -ForegroundColor Green
} else {
    Write-Host "    ❌ Regla de firewall para Frontend NO está configurada" -ForegroundColor Red
}

if ($backendRule -and $backendRule.Enabled -eq $true) {
    Write-Host "    ✅ Regla de firewall para Backend está activa" -ForegroundColor Green
} else {
    Write-Host "    ❌ Regla de firewall para Backend NO está configurada" -ForegroundColor Red
}
Write-Host ""

# 4. Verificar contenedores Docker
Write-Host "[4] Verificando contenedores Docker:" -ForegroundColor Yellow
try {
    $containers = docker ps --format "{{.Names}}" 2>$null
    if ($containers -match "mopi_frontend") {
        Write-Host "    ✅ mopi_frontend está corriendo" -ForegroundColor Green
    } else {
        Write-Host "    ❌ mopi_frontend NO está corriendo" -ForegroundColor Red
    }
    
    if ($containers -match "mopi_backend") {
        Write-Host "    ✅ mopi_backend está corriendo" -ForegroundColor Green
    } else {
        Write-Host "    ❌ mopi_backend NO está corriendo" -ForegroundColor Red
    }
} catch {
    Write-Host "    ❌ No se puede conectar a Docker" -ForegroundColor Red
}
Write-Host ""

# 5. Información del Gateway
Write-Host "[5] Información del Router/Gateway:" -ForegroundColor Yellow
$gateway = (Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Where-Object { $_.NextHop -ne "0.0.0.0" } | Select-Object -First 1).NextHop
Write-Host "    IP del Router: $gateway" -ForegroundColor White
Write-Host ""

# 6. Instrucciones de prueba
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Pruebas desde tu Celular" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Conéctate a la misma WiFi en tu celular" -ForegroundColor White
Write-Host ""
Write-Host "2. Abre el navegador del celular y ve a:" -ForegroundColor White
Write-Host "   http://$ipAddress:5173" -ForegroundColor Green
Write-Host ""
Write-Host "3. Si NO funciona, prueba lo siguiente:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   A) Verifica la IP de tu celular:" -ForegroundColor White
Write-Host "      Android: Ajustes > WiFi > (tu red) > Detalles" -ForegroundColor Cyan
Write-Host "      iPhone: Ajustes > WiFi > (i) junto a tu red" -ForegroundColor Cyan
Write-Host ""
Write-Host "   B) Haz ping desde esta PC al celular:" -ForegroundColor White
Write-Host "      ping [IP_DE_TU_CELULAR]" -ForegroundColor Cyan
Write-Host ""
Write-Host "   C) Si el ping NO responde, el problema es:" -ForegroundColor Yellow
Write-Host "      • Aislamiento AP (AP Isolation) en el router" -ForegroundColor Red
Write-Host "      • Accede a tu router ($gateway) y desactiva:" -ForegroundColor White
Write-Host "        - AP Isolation" -ForegroundColor Cyan
Write-Host "        - Client Isolation" -ForegroundColor Cyan
Write-Host "        - Wireless Isolation" -ForegroundColor Cyan
Write-Host ""

# 7. Prueba de conectividad al router
Write-Host "[6] Probando conectividad al router..." -ForegroundColor Yellow
$pingResult = Test-Connection -ComputerName $gateway -Count 2 -Quiet
if ($pingResult) {
    Write-Host "    ✅ Conectividad al router OK" -ForegroundColor Green
} else {
    Write-Host "    ❌ No hay conectividad al router" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor White
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
