# 🔌 Guía Completa: Conexión Frontend-Backend - Restaurante Don Pepe

## 🎯 Estado Actual

✅ **Backend desplegado en Fly.io**: https://mopi.fly.dev  
✅ **Base de datos PostgreSQL**: Configurada y funcionando  
✅ **Archivos estáticos**: Servidos correctamente con WhiteNoise  
✅ **CORS**: Configurado para frontend local y producción  
✅ **Frontend**: Configurado para conectar con backend en Fly.io

---

## 📋 Configuración Actual

### Backend (Fly.io)
- **URL**: https://mopi.fly.dev
- **Admin Panel**: https://mopi.fly.dev/admin/
- **API Base**: https://mopi.fly.dev/api/
- **Región**: Dallas, Texas (dfw)

### Frontend (Local)
- **URL**: http://localhost:5173
- **API configurada**: https://mopi.fly.dev
- **Archivo de configuración**: `.env`

---

## 🚀 Paso 1: Iniciar el Frontend

### 1.1 Navegar al directorio del frontend
```powershell
cd "d:\ULSA\MOPI\Restaurant-DonPepe-main\RestaurantSoft-main\Frontend"
```

### 1.2 Verificar archivo .env
El archivo `.env` ya está creado con:
```env
# URL de la API del Backend en Fly.io
VITE_API_URL=https://mopi.fly.dev
```

### 1.3 Instalar dependencias (si es necesario)
```powershell
npm install
```

### 1.4 Iniciar el servidor de desarrollo
```powershell
npm run dev
```

El frontend debería estar disponible en: **http://localhost:5173**

---

## 🔑 Paso 2: Crear Usuario Administrador en el Backend

Para poder iniciar sesión en la aplicación, necesitas crear un superusuario:

### Opción A: Desde la Terminal (Recomendado)
```powershell
# Conectar al servidor de Fly.io
flyctl ssh console -a mopi

# Dentro del servidor, ejecutar:
python manage.py createsuperuser

# Seguir las instrucciones:
# - Username: admin
# - Email: admin@mopi.com
# - Password: (tu contraseña segura)
# - Role: administrador
```

### Opción B: Usuario por Defecto
El sistema ya carga datos de producción con usuarios predeterminados.  
Verifica en el admin: https://mopi.fly.dev/admin/

**Credenciales de admin por defecto** (si existen):
- Usuario: `admin`
- Contraseña: `mopi2024`

---

## 🧪 Paso 3: Probar la Conexión

### 3.1 Verificar que el backend responde
Abre en tu navegador:
```
https://mopi.fly.dev/api/administrador/dashboard/
```

**Respuesta esperada**: JSON con datos del dashboard o un error 401 (no autenticado)

### 3.2 Verificar CORS
Abre las **DevTools** del navegador (F12) en http://localhost:5173 y verifica:
- Console: No debe haber errores CORS
- Network: Las peticiones a `mopi.fly.dev` deben tener estado 200 o 401

### 3.3 Probar Login desde el Frontend
1. Accede a http://localhost:5173
2. Ingresa credenciales de usuario
3. Deberías poder iniciar sesión sin errores

---

## 🔧 Endpoints Disponibles

### Autenticación
- **POST** `/api/users/login/` - Iniciar sesión
- **POST** `/api/users/verify-pin/` - Verificar PIN

### Administrador
- **GET** `/api/administrador/dashboard/` - Dashboard con estadísticas
- **GET/POST** `/api/administrador/categorias-menu/` - Categorías del menú
- **GET/POST** `/api/administrador/platos/` - Platos
- **GET/POST** `/api/administrador/inventario/` - Inventario
- **GET/POST** `/api/administrador/personal/` - Personal
- **GET** `/api/administrador/menu-completo/` - Menú completo

### Mesero
- **GET** `/api/mesero/tables/` - Mesas
- **GET/POST** `/api/mesero/mesero-orders/` - Órdenes de mesero
- **GET** `/api/mesero/mesero-orders/open/` - Órdenes abiertas

### Cocina
- **GET** `/api/cocina/orders/` - Todas las órdenes
- **GET** `/api/cocina/orders/kitchen/` - Órdenes activas de cocina

### Caja
- **GET/POST** `/api/caja/cajas/` - Cajas
- **GET/POST** `/api/caja/facturas/` - Facturas
- **GET/POST** `/api/caja/pagos/` - Pagos
- **GET** `/api/caja/mesas-pendientes/` - Mesas con cuentas pendientes

---

## 🐛 Resolución de Problemas Comunes

### Error: "No se pudo conectar con el backend"

**Solución 1**: Verificar que el backend esté corriendo
```powershell
flyctl status -a mopi
```
Debe mostrar `STATE: started` y `CHECKS: 1 total, 1 passing`

**Solución 2**: Verificar la URL en .env
```env
VITE_API_URL=https://mopi.fly.dev
```
**SIN slash final** y **con HTTPS**

**Solución 3**: Reiniciar el servidor de desarrollo del frontend
```powershell
# Detener con Ctrl+C
npm run dev
```

### Error CORS: "Access-Control-Allow-Origin"

**Verificar CORS en el backend**:
```powershell
flyctl secrets list -a mopi
```

Debe incluir:
```
CORS_ALLOWED_ORIGINS = https://mopi.fly.dev,http://localhost:5173,http://127.0.0.1:5173
```

**Actualizar si es necesario**:
```powershell
flyctl secrets set CORS_ALLOWED_ORIGINS="https://mopi.fly.dev,http://localhost:5173,http://127.0.0.1:5173" -a mopi
```

### Error 401: Unauthorized

Esto es **normal** si no has iniciado sesión. Significa que el backend está funcionando correctamente.

**Solución**: Iniciar sesión con credenciales válidas desde el frontend.

### Error 403: Forbidden

El usuario no tiene permisos para esa acción.

**Solución**: Verificar que el usuario tenga el rol correcto (administrador, mesero, cocina, caja).

### Error 500: Internal Server Error

Hay un problema en el backend.

**Ver logs del backend**:
```powershell
flyctl logs -a mopi
```

**Solución común**: Ejecutar migraciones
```powershell
flyctl ssh console -a mopi
python manage.py migrate
```

---

## 📊 Verificar Estado del Sistema

### Backend (Fly.io)
```powershell
# Ver estado general
flyctl status -a mopi

# Ver logs en tiempo real
flyctl logs -a mopi

# Ver uso de recursos
flyctl vm status -a mopi
```

### Base de Datos
```powershell
# Conectar a PostgreSQL
flyctl postgres connect -a mopi-db

# Ver información de la DB
flyctl postgres info mopi-db
```

### Frontend (Local)
```powershell
# Verificar que el servidor esté corriendo
# Debería mostrar: Local: http://localhost:5173/
```

---

## 🔐 Gestión de Usuarios

### Crear nuevo usuario desde el Admin Panel

1. Acceder a https://mopi.fly.dev/admin/
2. Iniciar sesión con credenciales de admin
3. Ir a "Users" → "Add User"
4. Completar:
   - Username
   - Email
   - Password
   - **Role**: Seleccionar rol (administrador, mesero, cocina, caja)
   - PIN (para login rápido en la app)

### Crear usuario desde la terminal

```powershell
flyctl ssh console -a mopi

# Dentro del servidor
python manage.py shell

# En el shell de Python
from users.models import User
user = User.objects.create_user(
    username='mesero1',
    email='mesero1@mopi.com',
    password='password123',
    role='mesero',
    pin='1234'
)
print(f"Usuario {user.username} creado con rol {user.role}")
exit()
```

---

## 📱 Flujo de Uso de la Aplicación

### 1. Login
- El usuario ingresa username/email y password
- O ingresa su PIN de 4 dígitos
- El sistema devuelve un token de autenticación
- El token se guarda en `localStorage`

### 2. Navegación por Roles

#### Administrador
- Dashboard con estadísticas
- Gestión de menú (categorías y platos)
- Gestión de inventario
- Gestión de personal
- Reportes

#### Mesero
- Ver mesas disponibles
- Tomar órdenes
- Ver órdenes abiertas
- Actualizar estado de órdenes

#### Cocina
- Ver órdenes pendientes
- Actualizar estado de preparación
- Marcar platos como listos

#### Caja
- Ver mesas con cuentas pendientes
- Generar facturas
- Procesar pagos
- Cerrar cuentas

---

## 🌐 Desplegar Frontend en Fly.io (Opcional)

Si quieres desplegar también el frontend en Fly.io:

### 1. Crear app para frontend
```powershell
cd "d:\ULSA\MOPI\Restaurant-DonPepe-main\RestaurantSoft-main\Frontend"
flyctl launch --name mopi-frontend
```

### 2. Configurar variables de entorno
```powershell
flyctl secrets set VITE_API_URL="https://mopi.fly.dev" -a mopi-frontend
```

### 3. Actualizar CORS en el backend
```powershell
flyctl secrets set CORS_ALLOWED_ORIGINS="https://mopi.fly.dev,https://mopi-frontend.fly.dev,http://localhost:5173" -a mopi
```

### 4. Desplegar
```powershell
flyctl deploy -a mopi-frontend
```

---

## 📝 Notas Importantes

### ⚠️ Seguridad

1. **Nunca** commits archivos `.env` al repositorio
2. Usa contraseñas fuertes para usuarios de producción
3. Cambia las credenciales por defecto
4. El token de autenticación expira según configuración de Django

### 🔄 Actualizar el Backend

Cuando hagas cambios en el código del backend:

```powershell
cd "d:\ULSA\MOPI\Backend - MOPI - Restaurante"
flyctl deploy --remote-only
```

### 🔄 Actualizar el Frontend (local)

Los cambios se reflejan automáticamente en desarrollo (hot reload).

Para producción, hacer build:
```powershell
npm run build
```

---

## 📞 Testing con Herramientas

### Probar API con curl
```powershell
# Test de login
curl -X POST https://mopi.fly.dev/api/users/login/ `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"mopi2024"}'

# Test de dashboard (requiere token)
curl -X GET https://mopi.fly.dev/api/administrador/dashboard/ `
  -H "Authorization: Token TU_TOKEN_AQUI"
```

### Probar API con Postman
1. Importar endpoints desde la documentación
2. Configurar base URL: `https://mopi.fly.dev`
3. Usar Authorization type: "Token" con el token obtenido del login

---

## ✅ Checklist de Verificación

- [ ] Backend corriendo en Fly.io (https://mopi.fly.dev)
- [ ] Health checks pasando (1/1 passing)
- [ ] Admin panel accesible y con estilos CSS
- [ ] Archivo `.env` creado en frontend
- [ ] Frontend corriendo en localhost:5173
- [ ] CORS configurado correctamente
- [ ] Usuario administrador creado
- [ ] Login funcional desde frontend
- [ ] API respondiendo correctamente

---

## 🎉 ¡Todo Listo!

Tu sistema **Restaurante Don Pepe** está completamente funcional:

- ✅ **Backend**: https://mopi.fly.dev
- ✅ **Frontend**: http://localhost:5173 (desarrollo)
- ✅ **Base de Datos**: PostgreSQL en Fly.io
- ✅ **Comunicación**: Frontend ↔ Backend funcionando

**¡Empieza a usar tu aplicación!** 🚀

---

**Última actualización**: 18 de noviembre, 2025  
**Configurado por**: ernesto.piura@est.ulsa.edu.ni
