# 🚀 Instrucciones Simples para Deploy en Render

## ❌ Problema Anterior
Nada funcionaba porque los comandos eran complicados y usaban Docker innecesariamente.

## ✅ Solución Nueva (ULTRA SIMPLE)

### Lo que he cambiado:

1. **Eliminado todo lo de Docker** - Ya no se usa, Render maneja Python directamente
2. **Creado `setup_production.py`** - Un comando inteligente que:
   - ✅ Verifica si ya hay datos
   - ✅ Si NO hay datos: crea usuarios y menú
   - ✅ Si YA hay datos: no toca nada
   - ✅ Funciona automáticamente sin preguntar nada

3. **Simplificado `build.sh`** - Ahora solo hace:
   ```bash
   1. Instalar dependencias
   2. Ejecutar migraciones
   3. Recoger archivos estáticos
   4. Ejecutar setup_production (inteligente)
   ```

4. **`render.yaml`** - Ya NO usa Docker, solo Python nativo

---

## 🚀 Cómo Hacer Deploy AHORA

### Paso 1: Subir los cambios (30 segundos)
```powershell
cd "d:\ULSA\MOPI"
.\deploy-simple.ps1
```

Este script hace automáticamente:
- `git add .`
- `git commit`
- `git push origin main`

### Paso 2: Deploy en Render (5-10 minutos)
1. Ve a https://dashboard.render.com/
2. Click en **"mopi-backend"**
3. Click en **"Manual Deploy"** → **"Deploy latest commit"**
4. Espera 5-10 minutos

### Paso 3: Verificar (30 segundos)
```powershell
.\test-render-backend.ps1
```

---

## 📊 Qué Hace el Build Automáticamente

### Primera vez (BD vacía):
```
📦 Instalando dependencias... ✅
🔄 Ejecutando migraciones... ✅
📁 Recolectando archivos estáticos... ✅
🔧 Configurando aplicación...
   👥 Creando usuarios:
      ✅ Restaurante (admin)
      ✅ admin (admin temporal)
      ✅ 2 cocineros
      ✅ 4 meseros
      ✅ 1 cajero
   🍽️ Poblando menú:
      ✅ 16 categorías
      ✅ 150+ platos
      ✅ 20 mesas
✅ Build completado!
```

### Deploys siguientes (BD con datos):
```
📦 Instalando dependencias... ✅
🔄 Ejecutando migraciones... ✅
📁 Recolectando archivos estáticos... ✅
🔧 Configurando aplicación...
   ✅ Usuarios ya existen (9)
   ✅ Menú ya existe (150+ platos)
   ✅ Mesas ya existen (20)
✅ Build completado!
```

**NO borra los datos existentes** ✅

---

## 👥 Usuarios Creados

| Usuario | Password | Rol |
|---------|----------|-----|
| `Restaurante` | `Contraseña123` | Admin |
| `admin` | `mopi2024` | Admin |
| `carlos.chef` | `password123` | Cocinero |
| `ana.cook` | `password123` | Cocinera |
| `juan.waiter` | `password123` | Mesero |
| `maria.waiter` | `password123` | Mesera |
| `luis.waiter` | `password123` | Mesero |
| `sofia.waiter` | `password123` | Mesera |
| `roberto.cashier` | `password123` | Cajero |

---

## 🍽️ Menú Cargado

- **16 categorías**
- **150+ platos** incluyendo:
  - Carnes de res (25+ platos)
  - Carnes blancas (24+ platos)
  - Carne de cerdo
  - Mariscos
  - Sopas
  - Cocteles
  - Extras (tostones, tajadas, papas, etc.)
- **20 mesas** configuradas

---

## 🔍 Verificación

### 1. Health Check
```bash
curl https://mopi-backend-aa6a.onrender.com/health/
```
Esperado: `{"status":"ok","message":"MOPI Backend is running"}`

### 2. Database Check
```bash
curl https://mopi-backend-aa6a.onrender.com/check-db/
```
Esperado:
```json
{
  "status": "ok",
  "data": {
    "total_users": 9,
    "total_platos": 150+,
    "total_mesas": 20
  }
}
```

### 3. Login con Restaurante
```powershell
$body = @{ username = "Restaurante"; password = "Contraseña123" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://mopi-backend-aa6a.onrender.com/api/users/login/" -Method Post -Body $body -ContentType "application/json"
```
Esperado: `{"token":"...", "username":"Restaurante", "role":"admin"}`

---

## ❓ FAQ

### ¿Por qué no funciona?
**Revisa los logs en Render:**
1. Ve a tu servicio en Render
2. Click en **"Logs"**
3. Busca mensajes de error

Los logs más importantes son:
- `🔧 Configurando aplicación...`
- `✅ Build completado!`

### ¿Cómo borro los datos y empiezo de cero?
**Opción 1: Borrar la BD en Render**
1. Dashboard → Databases → mopi-database
2. Settings → Delete Database
3. Volver a hacer deploy

**Opción 2: Usar el comando reset**
(Conectarse por SSH a Render y ejecutar)
```bash
python manage.py reset_and_populate --force
```

### ¿El frontend no se conecta?
**Verifica variables de entorno:**
- Frontend: `VITE_API_URL` = `https://mopi-backend-aa6a.onrender.com`
- Backend: `CORS_ALLOWED_ORIGINS` = `https://mopi-frontend.onrender.com`

---

## 📁 Archivos Importantes

- `build.sh` - Script de build (se ejecuta automáticamente)
- `setup_production.py` - Comando inteligente de configuración
- `render.yaml` - Configuración de Render (NO usa Docker)
- `deploy-simple.ps1` - Script para hacer commit/push rápido
- `test-render-backend.ps1` - Script para probar el backend

---

## ✅ Checklist Final

Después del deploy, verifica que:

- [ ] Backend responde en `/health/`
- [ ] `/check-db/` muestra 9 usuarios
- [ ] `/check-db/` muestra 150+ platos
- [ ] `/check-db/` muestra 20 mesas
- [ ] Login con `Restaurante`/`Contraseña123` funciona
- [ ] Login con `admin`/`mopi2024` funciona
- [ ] Frontend puede ver la lista de usuarios
- [ ] Frontend puede ver el menú completo
- [ ] Frontend NO muestra "Usando datos de referencia"

---

## 🆘 Si Nada Funciona

1. **Mira los logs en Render** - Dashboard → mopi-backend → Logs
2. **Ejecuta el test** - `.\test-render-backend.ps1`
3. **Verifica las URLs**:
   - Backend: `https://mopi-backend-aa6a.onrender.com`
   - Frontend: `https://mopi-frontend.onrender.com`
4. **Comparte los logs** - Copia el output del build y compártelo

---

**Última actualización**: 18 Nov 2025  
**Enfoque**: Sin Docker, ultra simple, funciona automáticamente
