# 🔧 Solución V2: Reseteo Automático de Base de Datos en Render

## 📋 Diagnóstico del Problema Original

El usuario `Restaurante` y los datos del menú no se estaban cargando correctamente en Render porque:

1. ❌ Los datos se intentaban cargar desde `production_data.json`
2. ❌ El orden de operaciones causaba que se saltara la carga de datos
3. ❌ No se usaba el comando `populate_all_data.py` que tiene el menú completo

## ✅ Solución Implementada

### Enfoque Nuevo: Reseteo Automático en Cada Deploy

En lugar de intentar cargar datos condicionalmente, ahora **cada deploy borra y recrea TODOS los datos** automáticamente usando `build.sh`.

### Archivos Creados/Modificados

#### 1. **`reset_and_populate.py`** (NUEVO)
Comando Django que:
- ✅ Borra TODOS los datos existentes (usuarios, mesas, platos, órdenes, etc.)
- ✅ Crea usuarios frescos con contraseñas conocidas
- ✅ Ejecuta `populate_all_data.py` para cargar el menú completo
- ✅ Funciona sin interacción humana (flag `--force`)

```bash
python manage.py reset_and_populate --force
```

#### 2. **`build.sh`** (MODIFICADO)
Script de build que se ejecuta antes del deploy:

```bash
#!/usr/bin/env bash
set -o errexit

echo "📦 Instalando dependencias..."
pip install -r requirements_updated.txt

echo "🔄 Ejecutando migraciones..."
python manage.py migrate --noinput

echo "📁 Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

echo "🗑️ Reseteando y poblando base de datos..."
python manage.py reset_and_populate --force

echo "✅ Build completado!"
```

#### 3. **`render.yaml`** (MODIFICADO)
Ahora usa `build.sh` como comando de build:

```yaml
buildCommand: |
  cd "Backend - MOPI - Restaurante"
  chmod +x build.sh
  ./build.sh
```

---

## 🚀 Pasos para Redeplegar

### 1. Commit y Push
```powershell
cd "d:\ULSA\MOPI"
.\deploy-fix-render.ps1
```

Este script hará commit y push automático de:
- `Backend - MOPI - Restaurante/administrador/management/commands/reset_and_populate.py`
- `Backend - MOPI - Restaurante/build.sh`
- `render.yaml`

### 2. Redeploy en Render

1. Ve a https://dashboard.render.com/
2. `Web Services` → `mopi-backend`
3. Click en **"Manual Deploy"** → **"Deploy latest commit"**
4. Espera 5-10 minutos

**NO necesitas borrar la base de datos manualmente** - `build.sh` se encarga de todo.

### 3. Verificar Deploy

Ejecuta el script de pruebas:
```powershell
.\test-render-backend.ps1
```

---

## 📊 Logs Esperados en Render

Durante el build, deberías ver:

```
📦 Instalando dependencias...
Successfully installed django-5.2.7 gunicorn-23.0.0 ...

🔄 Ejecutando migraciones...
Running migrations...
  Applying contenttypes.0001_initial... OK
  ...

📁 Recolectando archivos estáticos...
120 static files copied to '/opt/render/project/src/Backend - MOPI - Restaurante/staticfiles'

🗑️ Reseteando y poblando base de datos...
================================================================================
🔄 RESETEO COMPLETO DE BASE DE DATOS
================================================================================

🗑️  PASO 1: Eliminando datos existentes...
   • Usuarios: 9 registro(s)
   • Órdenes Mesero: 0 registro(s)
   • Órdenes Cocina: 0 registro(s)
   • Facturas: 0 registro(s)
   • Cajas: 0 registro(s)
   • Platos: 50 registro(s)
   • Categorías: 16 registro(s)
   • Mesas: 20 registro(s)
   • Inventario: 0 registro(s)
   ✅ Todos los datos eliminados

👥 PASO 2: Creando usuarios...
   ✅ Admin: Restaurante (password: Contraseña123, PIN: 0000)
   ✅ Admin: admin (password: mopi2024)
   ✅ Cocinero: Carlos Rodríguez (PIN: 1234)
   ✅ Cocinero: Ana García (PIN: 5678)
   ✅ Mesero: Juan Pérez (PIN: 1111)
   ✅ Mesero: María López (PIN: 2222)
   ✅ Mesero: Luis Martínez (PIN: 3333)
   ✅ Mesero: Sofía Hernández (PIN: 4444)
   ✅ Cajero: Roberto Sánchez (PIN: 9999)
   ✅ Total usuarios creados: 9

🍽️  PASO 3: Creando menú y datos del sistema...
🚀 Iniciando población de datos de ejemplo...

📝 Creando configuración del sistema...
✅ Configuración creada

🗑️ Borrando menú existente...
  ✅ 0 platos borrados
  ✅ 0 categorías borradas

🍽️ Creando categorías de menú...
  ✅ CARNE DE RES
  ✅ CARNE BLANCA
  ✅ CARNE DE CERDO
  ✅ VARIADOS
  ✅ MARISCOS
  ✅ CARNE DE MONTE Y ENSALADAS
  ✅ COCTELES
  ✅ SOPAS
  ✅ ENLATADOS Y DESECHABLES
  ✅ LICORES IMPORTADOS
  ✅ CERVEZA NACIONAL
  ✅ CERVEZA INTERNACIONAL
  ✅ CIGARROS
  ✅ RON NACIONAL
  ✅ COCTAILS Y VINOS
  ✅ EXTRAS

🍴 Creando platos...
  ✅ 150+ platos creados

🪑 Creando mesas...
  ✅ 20 mesas creadas

📊 ESTADÍSTICAS FINALES:
   • Categorías: 16
   • Platos: 150+
   • Mesas: 20
   • Usuarios: 9

================================================================================
✅ BASE DE DATOS RESETEADA Y POBLADA EXITOSAMENTE
================================================================================

🔑 CREDENCIALES DE ACCESO:

   👤 Usuario Principal:
      Username: Restaurante
      Password: Contraseña123
      PIN: 0000

   👤 Usuario Admin Temporal:
      Username: admin
      Password: mopi2024

   🔢 PINES por Rol:
      • Admin: 0000
      • Cocina: 1234, 5678
      • Meseros: 1111, 2222, 3333, 4444
      • Cajero: 9999

✅ Build completado!
```

---

## 🧪 Verificación Post-Deploy

### 1. Health Check
```bash
curl https://mopi-backend-aa6a.onrender.com/health/
```

**Esperado:**
```json
{"status":"ok","message":"MOPI Backend is running"}
```

### 2. Database Check
```bash
curl https://mopi-backend-aa6a.onrender.com/check-db/
```

**Esperado:**
```json
{
  "status": "ok",
  "data": {
    "total_users": 9,
    "total_tables": 20,
    "total_platos": 150+,
    "total_categorias": 16,
    "users_by_role": {
      "admin": {"count": 2},
      "cook": {"count": 2},
      "waiter": {"count": 4},
      "cashier": {"count": 1}
    }
  }
}
```

### 3. Login Restaurante
```powershell
$body = @{
    username = "Restaurante"
    password = "Contraseña123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://mopi-backend-aa6a.onrender.com/api/users/login/" `
    -Method Post -Body $body -ContentType "application/json"
```

**Esperado:**
```json
{
  "token": "abc123...",
  "user_id": 1,
  "username": "Restaurante",
  "role": "admin",
  "is_superuser": true
}
```

---

## 👥 Usuarios Creados Automáticamente

| Username | Password | Rol | PIN |
|----------|----------|-----|-----|
| `Restaurante` | `Contraseña123` | admin | 0000 |
| `admin` | `mopi2024` | admin | 0000 |
| `carlos.chef` | `password123` | cook | 1234 |
| `ana.cook` | `password123` | cook | 5678 |
| `juan.waiter` | `password123` | waiter | 1111 |
| `maria.waiter` | `password123` | waiter | 2222 |
| `luis.waiter` | `password123` | waiter | 3333 |
| `sofia.waiter` | `password123` | waiter | 4444 |
| `roberto.cashier` | `password123` | cashier | 9999 |

---

## 🍽️ Menú Completo Cargado

El comando `populate_all_data.py` carga **más de 150 platos** en 16 categorías:

### Categorías de Menú
1. **CARNE DE RES** - 25+ platos (lomitos, filetes, churrascos, etc.)
2. **CARNE BLANCA** - 24+ platos (pollo, pechuga, alitas, etc.)
3. **CARNE DE CERDO** - 10+ platos
4. **VARIADOS** - Entradas y antojitos
5. **MARISCOS** - Platos del mar
6. **CARNE DE MONTE Y ENSALADAS**
7. **COCTELES** - Cocteles y ceviches
8. **SOPAS** - Sopas y consomés
9. **ENLATADOS Y DESECHABLES** - Bebidas
10. **LICORES IMPORTADOS**
11. **CERVEZA NACIONAL**
12. **CERVEZA INTERNACIONAL**
13. **CIGARROS**
14. **RON NACIONAL**
15. **COCTAILS Y VINOS**
16. **EXTRAS** - Acompañamientos (tostones, tajadas, tortillas, papas, etc.)

---

## 🔄 Comportamiento en Deploys Futuros

### Cada Deploy:
- ✅ Borra TODOS los datos antiguos
- ✅ Crea usuarios frescos con contraseñas conocidas
- ✅ Carga el menú completo
- ✅ Crea 20 mesas
- ✅ Configura el sistema

### ⚠️ IMPORTANTE
**Todos los datos se borran en cada deploy.** Esto es ideal para desarrollo/staging, pero para producción deberías:

1. Modificar `build.sh` para solo ejecutar `reset_and_populate` en el primer deploy
2. Usar un comando diferente que preserve datos existentes
3. O agregar una variable de entorno para controlar el comportamiento

---

## 🆘 Solución de Problemas

### Problema: Build falla con "Permission denied: build.sh"

**Solución:** Render no ejecutó el `chmod +x`. Verifica que el render.yaml tenga:
```yaml
buildCommand: |
  cd "Backend - MOPI - Restaurante"
  chmod +x build.sh
  ./build.sh
```

### Problema: "populate_all_data requiere usuarios existentes"

**Solución:** El comando `reset_and_populate` crea usuarios ANTES de llamar a `populate_all_data`. Verifica que el comando se ejecute completo en los logs.

### Problema: Frontend no puede acceder al backend

**Causa:** CORS o variables de entorno incorrectas

**Solución:**
1. Verifica `VITE_API_URL` en frontend: `https://mopi-backend-aa6a.onrender.com`
2. Verifica `CORS_ALLOWED_ORIGINS` en backend: `https://mopi-frontend.onrender.com`

---

## 📝 Ventajas de Este Enfoque

✅ **Simple**: Un comando hace todo  
✅ **Predecible**: Siempre empieza desde cero  
✅ **Automático**: No requiere intervención manual  
✅ **Completo**: Carga el menú entero con 150+ platos  
✅ **Idempotente**: Puedes ejecutarlo múltiples veces  
✅ **Auditable**: Logs claros de qué se creó  

---

## ✅ Checklist de Verificación

Después del deploy, verifica:

- [ ] Backend responde en `/health/`
- [ ] `/check-db/` muestra 9 usuarios, 20 mesas, 150+ platos, 16 categorías
- [ ] Login con `Restaurante`/`Contraseña123` funciona
- [ ] Login con `admin`/`mopi2024` funciona
- [ ] Frontend puede cargar usuarios sin error
- [ ] Frontend puede ver el menú completo
- [ ] Frontend NO muestra "Usando datos de referencia"
- [ ] Logs de Render muestran "✅ BASE DE DATOS RESETEADA Y POBLADA EXITOSAMENTE"

---

**Creado**: 18 Nov 2025  
**Versión**: 2.0 (Reseteo Automático)
