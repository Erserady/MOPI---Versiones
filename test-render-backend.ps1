# Script para probar el backend desplegado en Render
# Uso: .\test-render-backend.ps1

param(
    [string]$BackendUrl = "https://mopi-backend-aa6a.onrender.com"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🧪 PRUEBAS DEL BACKEND MOPI EN RENDER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend URL: $BackendUrl" -ForegroundColor Yellow
Write-Host ""

# Función para hacer peticiones con mejor manejo de errores
function Invoke-ApiRequest {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = $null,
        [string]$Description
    )
    
    Write-Host "➜ $Description" -ForegroundColor White
    Write-Host "  URL: $Url" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
            TimeoutSec = 30
        }
        
        if ($Body) {
            $params['Body'] = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-RestMethod @params
        
        Write-Host "  ✅ Éxito!" -ForegroundColor Green
        
        return $response
    }
    catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "  Respuesta: $responseBody" -ForegroundColor Red
        }
        return $null
    }
}

# Test 1: Health Check
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "TEST 1: Health Check" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
$healthResponse = Invoke-ApiRequest -Url "$BackendUrl/health/" -Description "Verificando estado del servidor"

if ($healthResponse) {
    Write-Host "  Status: $($healthResponse.status)" -ForegroundColor Green
    Write-Host "  Message: $($healthResponse.message)" -ForegroundColor Green
}
Write-Host ""

# Test 2: Database Check
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "TEST 2: Database Check" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
$dbResponse = Invoke-ApiRequest -Url "$BackendUrl/check-db/" -Description "Verificando datos en la base de datos"

if ($dbResponse -and $dbResponse.status -eq "ok") {
    Write-Host ""
    Write-Host "  📊 ESTADÍSTICAS DE LA BASE DE DATOS:" -ForegroundColor Yellow
    Write-Host "  ─────────────────────────────────────" -ForegroundColor Gray
    Write-Host "  👥 Total Usuarios:    $($dbResponse.data.total_users)" -ForegroundColor White
    Write-Host "  🪑 Total Mesas:       $($dbResponse.data.total_tables)" -ForegroundColor White
    Write-Host "  🍽️  Total Platos:      $($dbResponse.data.total_platos)" -ForegroundColor White
    Write-Host "  📁 Total Categorías:  $($dbResponse.data.total_categorias)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "  👥 USUARIOS POR ROL:" -ForegroundColor Yellow
    Write-Host "  ─────────────────────────────────────" -ForegroundColor Gray
    foreach ($role in $dbResponse.data.users_by_role.PSObject.Properties) {
        $roleName = $role.Name
        $roleData = $role.Value
        Write-Host "  • $roleName`: $($roleData.count) usuario(s)" -ForegroundColor White
        
        if ($roleData.users -and $roleData.users.Count -gt 0) {
            foreach ($user in $roleData.users) {
                Write-Host "    - $($user.username) ($($user.first_name) $($user.last_name))" -ForegroundColor Gray
            }
        }
    }
    Write-Host ""
    
    # Verificaciones
    Write-Host "  ✓ VERIFICACIONES:" -ForegroundColor Yellow
    Write-Host "  ─────────────────────────────────────" -ForegroundColor Gray
    
    $checks = @()
    
    if ($dbResponse.data.total_users -gt 1) {
        Write-Host "  ✅ Hay múltiples usuarios en la base de datos" -ForegroundColor Green
        $checks += $true
    } else {
        Write-Host "  ❌ Solo hay $($dbResponse.data.total_users) usuario(s) - deberían ser al menos 9" -ForegroundColor Red
        $checks += $false
    }
    
    if ($dbResponse.data.total_platos -gt 10) {
        Write-Host "  ✅ Hay platos cargados en el menú" -ForegroundColor Green
        $checks += $true
    } else {
        Write-Host "  ❌ Hay muy pocos platos ($($dbResponse.data.total_platos)) - deberían ser más de 10" -ForegroundColor Red
        $checks += $false
    }
    
    if ($dbResponse.data.total_mesas -gt 10) {
        Write-Host "  ✅ Hay mesas configuradas" -ForegroundColor Green
        $checks += $true
    } else {
        Write-Host "  ❌ Hay muy pocas mesas ($($dbResponse.data.total_mesas)) - deberían ser al menos 10" -ForegroundColor Red
        $checks += $false
    }
    
    # Verificar si existe el usuario Restaurante
    $restauranteUser = $dbResponse.data.all_users | Where-Object { $_.username -eq "Restaurante" }
    if ($restauranteUser) {
        Write-Host "  ✅ Usuario 'Restaurante' existe en la base de datos" -ForegroundColor Green
        $checks += $true
    } else {
        Write-Host "  ❌ Usuario 'Restaurante' NO encontrado - revisar carga de datos" -ForegroundColor Red
        $checks += $false
    }
    
    $allPassed = $checks | Where-Object { $_ -eq $false } | Measure-Object | Select-Object -ExpandProperty Count
    
    Write-Host ""
    if ($allPassed -eq 0) {
        Write-Host "  🎉 TODAS LAS VERIFICACIONES PASARON!" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  ALGUNAS VERIFICACIONES FALLARON - Revisar configuración" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 3: Login con usuario Restaurante
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "TEST 3: Login Usuario Restaurante" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$loginBody = @{
    username = "Restaurante"
    password = "Contraseña123"
}

$loginResponse = Invoke-ApiRequest `
    -Url "$BackendUrl/api/users/login/" `
    -Method "POST" `
    -Body $loginBody `
    -Description "Intentando login con Restaurante/Contraseña123"

if ($loginResponse -and $loginResponse.token) {
    Write-Host ""
    Write-Host "  ✅ LOGIN EXITOSO!" -ForegroundColor Green
    Write-Host "  ─────────────────────────────────────" -ForegroundColor Gray
    Write-Host "  Token: $($loginResponse.token.Substring(0, 20))..." -ForegroundColor White
    Write-Host "  User ID: $($loginResponse.user_id)" -ForegroundColor White
    Write-Host "  Username: $($loginResponse.username)" -ForegroundColor White
    Write-Host "  Role: $($loginResponse.role)" -ForegroundColor White
    Write-Host "  Is Superuser: $($loginResponse.is_superuser)" -ForegroundColor White
}
Write-Host ""

# Test 4: Login con usuario admin
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "TEST 4: Login Usuario Admin" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$adminLoginBody = @{
    username = "admin"
    password = "mopi2024"
}

$adminLoginResponse = Invoke-ApiRequest `
    -Url "$BackendUrl/api/users/login/" `
    -Method "POST" `
    -Body $adminLoginBody `
    -Description "Intentando login con admin/mopi2024"

if ($adminLoginResponse -and $adminLoginResponse.token) {
    Write-Host ""
    Write-Host "  ✅ LOGIN EXITOSO!" -ForegroundColor Green
    Write-Host "  ─────────────────────────────────────" -ForegroundColor Gray
    Write-Host "  Token: $($adminLoginResponse.token.Substring(0, 20))..." -ForegroundColor White
    Write-Host "  User ID: $($adminLoginResponse.user_id)" -ForegroundColor White
    Write-Host "  Username: $($adminLoginResponse.username)" -ForegroundColor White
    Write-Host "  Role: $($adminLoginResponse.role)" -ForegroundColor White
}
Write-Host ""

# Resumen Final
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📋 RESUMEN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$summary = @()
$summary += [PSCustomObject]@{ Test = "Health Check"; Status = if ($healthResponse) { "✅ PASS" } else { "❌ FAIL" } }
$summary += [PSCustomObject]@{ Test = "Database Check"; Status = if ($dbResponse -and $dbResponse.status -eq "ok") { "✅ PASS" } else { "❌ FAIL" } }
$summary += [PSCustomObject]@{ Test = "Login Restaurante"; Status = if ($loginResponse -and $loginResponse.token) { "✅ PASS" } else { "❌ FAIL" } }
$summary += [PSCustomObject]@{ Test = "Login Admin"; Status = if ($adminLoginResponse -and $adminLoginResponse.token) { "✅ PASS" } else { "❌ FAIL" } }

$summary | Format-Table -AutoSize

$failCount = ($summary | Where-Object { $_.Status -like "*FAIL*" } | Measure-Object).Count

if ($failCount -eq 0) {
    Write-Host ""
    Write-Host "🎉 TODOS LOS TESTS PASARON - El backend está funcionando correctamente!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "⚠️  $failCount test(s) fallaron - Revisar logs en Render o seguir la guía de solución" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Revisar: SOLUCION_RENDER.md para más detalles" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
