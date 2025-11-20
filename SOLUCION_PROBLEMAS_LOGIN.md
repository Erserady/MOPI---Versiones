# 🔧 Solución de Problemas de Login - Frontend

## ✅ Problema Resuelto

**Error original**: El frontend intentaba conectarse a `localhost:8000` en lugar del backend en Fly.io.

**Causa**: El archivo `fly.toml` del frontend no tenía configurada la variable `VITE_API_URL` durante el build.

**Solución aplicada**: Agregué la configuración correcta y re-desplegué el frontend.

---

## 🎯 Cambios Realizados

### 1. Actualización de fly.toml

**Archivo**: `Frontend/fly.toml`

**Cambio**:
```toml
[build]
  [build.args]
    VITE_API_URL = "https://mopi.fly.dev"
```

Esto le dice a Vite (el bundler) que use `https://mopi.fly.dev` como URL del backend durante el proceso de build.

### 2. Re-despliegue del Frontend

```bash
flyctl deploy --remote-only
```

El frontend ahora se construye con la variable de entorno correcta, por lo que todas las llamadas a la API apuntan a `https://mopi.fly.dev` en lugar de `localhost:8000`.

---

## 🧪 Cómo Verificar que Funciona

### 1. Abre el Frontend

Visita: **https://mopi-frontend.fly.dev**

### 2. Abre las DevTools del Navegador

- Presiona `F12` o clic derecho → Inspeccionar
- Ve a la pestaña **Network** (Red)
- Ve a la pestaña **Console** (Consola)

### 3. Intenta Iniciar Sesión

Ingresa cualquier usuario/contraseña (aunque no exista aún).

### 4. Verifica las Peticiones en Network

Deberías ver una petición a:
```
https://mopi.fly.dev/api/users/login/
```

**✅ Correcto**: La URL es `https://mopi.fly.dev` (backend en Fly.io)  
**❌ Incorrecto**: La URL es `http://localhost:8000` (backend local)

### 5. Verifica los Errores en Console

**Antes** (con el error):
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
localhost:8000/api/users/login/
```

**Ahora** (corregido):
```
401 Unauthorized (si el usuario no existe)
o
200 OK (si el login es exitoso)
```

---

## 🔑 Crear Usuario para Probar Login

Ahora que el frontend está conectado correctamente al backend, necesitas crear un usuario:

### Opción A: Crear Superusuario

```powershell
# Conectar al backend en Fly.io
flyctl ssh console -a mopi

# Dentro del servidor
python manage.py createsuperuser

# Seguir instrucciones:
Username: admin
Email: admin@mopi.com
Password: ******** (tu contraseña)
Role: administrador
PIN: 1234 (opcional, para login rápido)
```

### Opción B: Crear Usuario Normal

```powershell
# Conectar al backend
flyctl ssh console -a mopi

# Abrir shell de Python
python manage.py shell

# Ejecutar en el shell:
from users.models import User

user = User.objects.create_user(
    username='mesero1',
    email='mesero1@mopi.com',
    password='pass123',
    role='mesero',
    pin='1234'
)

print(f"Usuario creado: {user.username}, Role: {user.role}")
exit()
```

---

## 📊 Flujo de Login Completo

```
┌─────────────────────────────────────────┐
│  Usuario ingresa credenciales          │
│  en https://mopi-frontend.fly.dev      │
└──────────────┬──────────────────────────┘
               │
               │ POST /api/users/login/
               ▼
┌──────────────────────────────────────────┐
│  Frontend hace petición a:               │
│  https://mopi.fly.dev/api/users/login/   │
└──────────────┬───────────────────────────┘
               │
               │ HTTPS Request
               ▼
┌──────────────────────────────────────────┐
│  Backend Django en Fly.io                │
│  Valida credenciales                     │
│  Devuelve token si es válido             │
└──────────────┬───────────────────────────┘
               │
               │ 200 OK + Token
               ▼
┌──────────────────────────────────────────┐
│  Frontend recibe token                   │
│  Guarda en localStorage                  │
│  Redirige al dashboard                   │
└──────────────────────────────────────────┘
```

---

## 🐛 Otros Errores Comunes y Soluciones

### Error: 404 Not Found en /favicon.ico

**Qué es**: El navegador busca el ícono del sitio.

**Solución**: No afecta la funcionalidad. Para corregirlo:

1. Agrega un archivo `favicon.ico` en `Frontend/public/`
2. O actualiza `index.html` con la ruta correcta:
   ```html
   <link rel="icon" href="/favicon.png" type="image/png" />
   ```

### Error: 401 Unauthorized

**Qué significa**: Las credenciales son incorrectas o el usuario no existe.

**Solución**: 
- Verifica que el usuario exista en la base de datos
- Verifica que la contraseña sea correcta
- Crea un usuario nuevo siguiendo las instrucciones arriba

### Error: 403 Forbidden

**Qué significa**: El usuario no tiene permisos para la acción.

**Solución**: Verifica que el usuario tenga el rol correcto (administrador, mesero, cocina, caja).

### Error: 500 Internal Server Error

**Qué significa**: Hay un error en el backend.

**Solución**:
```powershell
# Ver logs del backend
flyctl logs -a mopi

# Conectar al backend y revisar
flyctl ssh console -a mopi
```

### Error CORS (blocked by CORS policy)

**Qué significa**: El backend no permite peticiones desde el frontend.

**Verificar configuración**:
```powershell
flyctl secrets list -a mopi
```

Debe incluir:
```
CORS_ALLOWED_ORIGINS = https://mopi.fly.dev,https://mopi-frontend.fly.dev,...
```

**Actualizar si es necesario**:
```powershell
flyctl secrets set CORS_ALLOWED_ORIGINS="https://mopi.fly.dev,https://mopi-frontend.fly.dev,http://localhost:5173" -a mopi
```

---

## 🔍 Debugging Avanzado

### Ver Variables de Entorno del Build

```powershell
# Desde el directorio del frontend
flyctl secrets list -a mopi-frontend
```

### Ver Logs del Frontend

```powershell
flyctl logs -a mopi-frontend
```

### Inspeccionar el Código Desplegado

El frontend compilado está en el contenedor. Para ver la configuración de API:

1. Abre https://mopi-frontend.fly.dev
2. DevTools → Sources
3. Busca el archivo JavaScript principal (ej: `index-*.js`)
4. Busca "mopi.fly.dev" para confirmar que usa la URL correcta

---

## ✅ Checklist de Verificación

- [x] Frontend desplegado en Fly.io
- [x] Variable `VITE_API_URL` configurada en `fly.toml`
- [x] Frontend apunta a `https://mopi.fly.dev`
- [x] Backend respondiendo en `https://mopi.fly.dev`
- [x] CORS configurado correctamente
- [ ] **Usuario creado para login** ← Siguiente paso
- [ ] **Login funcional probado** ← Probar después de crear usuario

---

## 🎯 Próximos Pasos

1. **Crear usuario administrador**:
   ```powershell
   flyctl ssh console -a mopi
   python manage.py createsuperuser
   ```

2. **Probar login en el frontend**:
   - Ve a https://mopi-frontend.fly.dev
   - Ingresa las credenciales del usuario creado
   - Deberías poder iniciar sesión exitosamente

3. **Verificar funcionalidad completa**:
   - Navegar por el dashboard
   - Probar las diferentes secciones según tu rol
   - Verificar que las APIs funcionen correctamente

---

## 📞 Soporte

Si sigues teniendo problemas:

1. **Revisa los logs**:
   ```powershell
   flyctl logs -a mopi-frontend
   flyctl logs -a mopi
   ```

2. **Verifica el estado**:
   ```powershell
   flyctl status -a mopi-frontend
   flyctl status -a mopi
   ```

3. **Prueba directamente el backend**:
   ```powershell
   curl https://mopi.fly.dev/api/administrador/dashboard/
   ```

---

**Última actualización**: 18 de noviembre, 2025  
**Problema**: Frontend apuntando a localhost en lugar de backend en Fly.io  
**Solución**: Configurar VITE_API_URL en fly.toml y re-desplegar
