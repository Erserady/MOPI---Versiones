@echo off
REM Script para arreglar las mesas buggeadas y actualizar el backend

echo ================================================
echo ARREGLANDO MESAS BUGGEADAS Y ACTUALIZANDO BD
echo ================================================
echo.

REM Paso 1: Aplicar migraciones
echo PASO 1: Aplicando migraciones de base de datos...
python manage.py migrate mesero
echo Migraciones aplicadas
echo.

REM Paso 2: Limpiar mesas problemáticas
echo PASO 2: Limpiando mesas 1, 10 y 13...
python limpiar_mesas_buggeadas.py
echo Limpieza completada
echo.

REM Paso 3: Hacer commit
echo PASO 3: Guardando cambios...
git add .
git commit -m "Fix: Agregar waiter_id y waiter_name a WaiterOrder, limpiar mesas buggeadas"
echo Cambios guardados
echo.

REM Paso 4: Deploy a Fly.io
echo PASO 4: Desplegando a produccion...
flyctl deploy
echo Deploy completado
echo.

echo ================================================
echo PROCESO COMPLETADO
echo ================================================
echo.
echo Las mesas 1, 10 y 13 deberian funcionar ahora!
echo.
echo Para verificar:
echo 1. Abre https://mopi-frontend.fly.dev/
echo 2. Inicia sesion como mesero
echo 3. Las mesas 1, 10 y 13 deben aparecer como LIBRE
echo 4. Toma una orden en cualquiera de esas mesas
echo 5. Verifica que aparezca en cocina y caja
echo.
pause
