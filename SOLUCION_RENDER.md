# 🔧 Solución al Problema de Despliegue en Render

## 📋 Diagnóstico del Problema

### Causa Raíz
El orden de operaciones en `docker/entrypoint.sh` causaba que los datos de producción nunca se cargaran:

1. ✅ El script creaba el usuario `admin` primero
2. ❌ Luego intentaba cargar `production_data.json`
3. ❌ El comando `load_production_data` verificaba si existía el usuario `admin`
4. ❌ Al encontrarlo, asumía que la BD ya tenía datos y **salía sin cargar nada**

**Resultado**: No se cargaban los usuarios (Restaurante, meseros, etc.) ni los datos del menú.

---

## ✅ Cambios Realizados

### 1. `docker/entrypoint.sh` (Líneas 25-45)
**Cambio**: Invertir el orden de carga de datos

**Antes:**
```bash
# Crear admin primero
python manage.py shell << END
    # Crear superusuario admin
END

# Cargar datos después (fallaba aquí)
python manage.py load_production_data
```

**Después:**
```bash
# Cargar datos primero
python manage.py load_production_data

# Crear admin solo como fallback
python manage.py shell << END
    # Crear superusuario admin si no existe
END
```

### 2. `administrador/management/commands/load_production_data.py` (Línea 19-24)
**Cambio**: Eliminar verificación del usuario admin

**Antes:**
```python
has_data = (
    Table.objects.exists() or 
    Plato.objects.exists() or 
    CategoriaMenu.objects.exists() or
    User.objects.filter(username='admin').exists()  # ❌ Causa el problema
)
```

**Después:**
```python
has_data = (
    Table.objects.exists() or 
    Plato.objects.exists() or 
    CategoriaMenu.objects.exists()  # ✅ Solo verifica datos reales
)
```

---

## 🚀 Pasos para Redeplegar en Render

### Opción A: Redeploy Manual (Recomendado)

1. **Hacer commit y push de los cambios**
   ```powershell
   cd "d:\ULSA\MOPI"
   git add "Backend - MOPI - Restaurante/docker/entrypoint.sh"
   git add "Backend - MOPI - Restaurante/administrador/management/commands/load_production_data.py"
   git commit -m "Fix: Corregir orden de carga de datos en producción"
   git push origin main
   ```

2. **Borrar la base de datos actual en Render**
   - Ve a tu Dashboard de Render: https://dashboard.render.com/
   - Navega a: `Databases` → `mopi-database`
   - En el menú superior, busca el botón de opciones (⋮) o `Settings`
   - Busca la opción **"Delete Database"** o **"Drop Database"**
   - Confirma la eliminación
   
   > ⚠️ **IMPORTANTE**: Esto borrará todos los datos actuales. Como la BD está vacía o incorrecta, no hay problema.

3. **Redeplegar el Backend**
   - Ve a: `Web Services` → `mopi-backend`
   - Click en **"Manual Deploy"** → **"Deploy latest commit"**
   - Espera a que termine el deploy (5-10 minutos)

### Opción B: Redeployer sin Borrar BD

Si prefieres no borrar la base de datos, puedes conectarte por SSH y limpiarla manualmente:

1. **Hacer commit y push** (igual que Opción A, paso 1)

2. **Limpiar la base de datos vía comando Django**
   - En Render Dashboard, ve a `mopi-backend` → `Shell`
   - Ejecuta:
   ```bash
   cd "Backend - MOPI - Restaurante"
   python manage.py flush --noinput
   python manage.py migrate
   ```

3. **Reiniciar el servicio**
   - En la página del servicio, click en **"Manual Deploy"** o **"Restart"**

---

## 🧪 Verificación Post-Deploy

### 1. Verificar que el Backend esté funcionando
```powershell
# Verificar health check
curl https://mopi-backend-aa6a.onrender.com/health/
# Respuesta esperada: {"status":"ok","message":"MOPI Backend is running"}
```

### 2. Verificar que los datos se cargaron correctamente
```powershell
# Verificar estado de la base de datos
curl https://mopi-backend-aa6a.onrender.com/check-db/
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "message": "Database check",
  "data": {
    "total_users": 9,        // ✅ Debe ser > 1
    "total_tables": 20,      // ✅ Debe haber mesas
    "total_platos": 50,      // ✅ Debe haber platos (aprox)
    "total_categorias": 7,   // ✅ Debe haber categorías
    "users_by_role": {
      "admin": { "count": 2, ... },
      "mesero": { "count": 4, ... },
      "cocina": { "count": 2, ... },
      "caja": { "count": 1, ... }
    },
    "all_users": [
      {"username": "Restaurante", "role": "admin", ...},
      {"username": "admin", "role": "admin", ...},
      ...
    ]
  }
}
```

### 3. Probar Login con Usuario Restaurante
```powershell
# Crear archivo test_login.ps1
$body = @{
    username = "Restaurante"
    password = "Contraseña123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://mopi-backend-aa6a.onrender.com/api/users/login/" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

$response
```

**Respuesta esperada:**
```json
{
  "token": "abc123...",
  "user_id": 1,
  "username": "Restaurante",
  "role": "admin",
  "is_superuser": true
}
```

### 4. Probar Login con Admin Temporal
```powershell
$body = @{
    username = "admin"
    password = "mopi2024"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://mopi-backend-aa6a.onrender.com/api/users/login/" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

$response
```

---

## 📊 Usuarios Predeterminados Cargados

Después del deploy correcto, estos usuarios estarán disponibles:

| Username         | Password       | Rol     | Descripción              |
|------------------|----------------|---------|--------------------------|
| `Restaurante`    | `Contraseña123`| admin   | Usuario principal        |
| `admin`          | `mopi2024`     | admin   | Superusuario Django      |
| `administrador`  | `admin123`     | admin   | Administrador            |
| `carlos.mendez`  | `carlos123`    | mesero  | Mesero                   |
| `ana.torres`     | `ana123`       | mesero  | Mesera                   |
| `juan.perez`     | `juan123`      | mesero  | Mesero                   |
| `maria.garcia`   | `maria123`     | cocina  | Cocinera                 |
| `luis.ramirez`   | `luis123`      | cocina  | Cocinero                 |
| `sofia.lopez`    | `sofia123`     | caja    | Cajera                   |
| `roberto.diaz`   | `roberto123`   | caja    | Cajero                   |

---

## 🔍 Logs a Revisar en Render

Durante el deploy, busca estos mensajes en los logs del backend:

✅ **Mensajes Correctos:**
```
[init] Cargando datos de producción...
🔍 Verificando si hay datos en la base de datos...
📦 Cargando datos desde production_data.json...
✅ Datos de producción cargados correctamente

📊 Datos cargados:
   📁 Categorías: 7
   🍽️  Platos: 50+
   🪑 Mesas: 20
   👥 Usuarios: 9

🔐 Configurando contraseñas conocidas...
   ✅ Restaurante → Contraseña123
   ✅ administrador → admin123
   ✅ carlos.mendez → carlos123
   ...
```

❌ **Mensajes de Error (No deberían aparecer):**
```
✅ La base de datos ya contiene datos. No se cargarán datos de ejemplo.
```

---

## 🆘 Solución de Problemas Adicionales

### Problema: "No se pudieron cargar los usuarios desde el backend"

**Causa posible**: CORS o URL incorrecta del frontend

**Solución**:
1. Verifica que la variable de entorno en el frontend sea correcta:
   ```
   VITE_API_URL: https://mopi-backend-aa6a.onrender.com
   ```
   (SIN barra al final)

2. Verifica CORS en el backend:
   ```
   CORS_ALLOWED_ORIGINS: https://mopi-frontend.onrender.com
   ```

3. Verifica desde el navegador (F12 → Console) si hay errores CORS

### Problema: Backend responde pero login falla

**Causa**: Contraseñas no reseteadas correctamente

**Solución**: Conectarse por SSH a Render y ejecutar:
```bash
cd "Backend - MOPI - Restaurante"
python manage.py shell << END
from users.models import User
user = User.objects.get(username='Restaurante')
user.set_password('Contraseña123')
user.save()
print('Password updated!')
END
```

---

## 📝 Notas Importantes

1. **Render Free Tier**: Los servicios free se duermen después de 15 minutos de inactividad. La primera petición puede tardar 30-60 segundos.

2. **Base de Datos Persistente**: Una vez cargados los datos correctamente, se mantendrán entre deploys. Solo se recargarán si la BD está completamente vacía.

3. **Variables de Entorno**: Asegúrate de que todas las variables listadas al inicio estén configuradas en Render.

4. **Frontend**: El frontend no necesita cambios. Una vez que el backend funcione, el frontend debería conectarse automáticamente.

---

## ✅ Checklist Final

Antes de considerar el problema resuelto, verifica:

- [ ] Backend responde en `/health/`
- [ ] `/check-db/` muestra usuarios, mesas, platos y categorías
- [ ] Login con `Restaurante` / `Contraseña123` funciona
- [ ] Login con `admin` / `mopi2024` funciona
- [ ] Frontend puede cargar la lista de usuarios
- [ ] Frontend puede ver el menú de platos
- [ ] Frontend no muestra "Usando datos de referencia"

---

**Creado**: 18 Nov 2025  
**Última actualización**: 18 Nov 2025
