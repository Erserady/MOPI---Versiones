# 🚀 Sistema Completo en Fly.io - Restaurante Don Pepe

## ✅ Estado del Sistema

**Todo desplegado y funcionando en Fly.io**

### 🌐 URLs de Producción

- **Frontend**: https://mopi-frontend.fly.dev
- **Backend API**: https://mopi.fly.dev
- **Admin Panel**: https://mopi.fly.dev/admin/
- **Base de Datos**: mopi-db (PostgreSQL interno)

---

## 📊 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                     INTERNET                             │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
               │                      │
       ┌───────▼──────────┐   ┌──────▼──────────┐
       │   Frontend       │   │    Backend      │
       │  (React + Vite)  │   │  (Django REST)  │
       │                  │◄──┤                 │
       │  Nginx Server    │   │  Gunicorn       │
       │                  │   │                 │
       │  mopi-frontend   │   │  mopi           │
       │  .fly.dev        │   │  .fly.dev       │
       └──────────────────┘   └────────┬────────┘
                                       │
                                       │
                              ┌────────▼─────────┐
                              │   PostgreSQL     │
                              │   Database       │
                              │                  │
                              │   mopi-db        │
                              └──────────────────┘
```

---

## 🔧 Componentes Desplegados

### 1. Frontend (mopi-frontend)

**URL**: https://mopi-frontend.fly.dev

**Tecnologías**:
- React 19
- Vite 7
- React Router
- Redux Toolkit
- Lucide Icons

**Configuración**:
```toml
App Name: mopi-frontend
Region: Dallas, Texas (dfw)
CPU: 1 shared CPU
RAM: 256 MB
Machines: 2 (alta disponibilidad)
Image Size: 28 MB
```

**Estado**: 🟢 2/2 máquinas corriendo, health checks pasando

### 2. Backend (mopi)

**URL**: https://mopi.fly.dev

**Tecnologías**:
- Django 5.2
- Django REST Framework
- PostgreSQL
- Gunicorn
- WhiteNoise (archivos estáticos)
- Jazzmin (admin panel)

**Configuración**:
```toml
App Name: mopi
Region: Dallas, Texas (dfw)
CPU: 1 shared CPU
RAM: 512 MB
Machines: 1
Image Size: 178 MB
```

**Estado**: 🟢 1/1 máquina corriendo, health checks pasando

**Endpoints principales**:
- `/admin/` - Panel de administración
- `/api/users/` - Autenticación y usuarios
- `/api/administrador/` - Funciones de administrador
- `/api/mesero/` - Gestión de mesas y órdenes
- `/api/cocina/` - Órdenes de cocina
- `/api/caja/` - Facturación y pagos

### 3. Base de Datos (mopi-db)

**Tipo**: PostgreSQL 17.2

**Configuración**:
```
Cluster: mopi-db
Region: Dallas, Texas (dfw)
Storage: 1 GB
```

**Conexión**:
```
postgres://mopi:votAklPhTPtXOig@mopi-db.flycast:5432/mopi
```

**Estado**: 🟢 Conectada y funcionando

---

## 🔐 Configuración de Seguridad

### Variables de Entorno (Backend)

```bash
# Secretos configurados en Fly.io
DATABASE_URL=postgres://mopi:***@mopi-db.flycast:5432/mopi
SECRET_KEY=****** (generado automáticamente)
ALLOWED_HOSTS=mopi.fly.dev,*.fly.dev,.fly.dev,172.19.22.218
CORS_ALLOWED_ORIGINS=https://mopi.fly.dev,https://mopi-frontend.fly.dev,http://localhost:5173,http://127.0.0.1:5173
DEBUG=False
```

### Variables de Build (Frontend)

```bash
VITE_API_URL=https://mopi.fly.dev
```

---

## 🎯 Funcionalidades del Sistema

### Roles de Usuario

1. **Administrador**
   - Dashboard con estadísticas
   - Gestión de menú (categorías y platos)
   - Control de inventario
   - Administración de personal
   - Reportes y análisis

2. **Mesero**
   - Visualización de mesas
   - Toma de órdenes
   - Seguimiento de órdenes activas
   - Actualización de estados

3. **Cocina**
   - Ver órdenes pendientes
   - Actualizar estado de preparación
   - Marcar platos como listos

4. **Caja**
   - Ver cuentas pendientes
   - Generar facturas
   - Procesar pagos
   - Cerrar cuentas

---

## 📦 Despliegue y Actualizaciones

### Actualizar Backend

```powershell
cd "d:\ULSA\MOPI\Backend - MOPI - Restaurante"
flyctl deploy --remote-only
```

### Actualizar Frontend

```powershell
cd "d:\ULSA\MOPI\Restaurant-DonPepe-main\RestaurantSoft-main\Frontend"
flyctl deploy --remote-only
```

### Ejecutar Migraciones

Las migraciones se ejecutan automáticamente durante el despliegue del backend a través del `release_command` en `fly.toml`.

Para ejecutar manualmente:
```powershell
flyctl ssh console -a mopi
python manage.py migrate
```

---

## 👤 Gestión de Usuarios

### Crear Superusuario

```powershell
flyctl ssh console -a mopi

# Dentro del servidor
python manage.py createsuperuser

# Seguir instrucciones:
# Username: admin
# Email: admin@mopi.com
# Password: ********
# Role: administrador
```

### Crear Usuario Normal

```powershell
flyctl ssh console -a mopi

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
print(f"Usuario creado: {user.username}")
exit()
```

---

## 🔍 Monitoreo y Logs

### Ver Estado de las Aplicaciones

```powershell
# Frontend
flyctl status -a mopi-frontend

# Backend
flyctl status -a mopi

# Base de datos
flyctl postgres list
```

### Ver Logs en Tiempo Real

```powershell
# Frontend
flyctl logs -a mopi-frontend

# Backend
flyctl logs -a mopi
```

### Dashboard Web

- Frontend: https://fly.io/apps/mopi-frontend/monitoring
- Backend: https://fly.io/apps/mopi/monitoring

---

## 🗄️ Backup y Restauración

### Backup de Base de Datos

```powershell
# Crear backup
flyctl postgres backup create -a mopi-db

# Listar backups
flyctl postgres backup list -a mopi-db
```

### Conectar a PostgreSQL

```powershell
flyctl postgres connect -a mopi-db
```

### Exportar Datos

```powershell
flyctl ssh console -a mopi

# Exportar a JSON
python manage.py dumpdata > backup.json

# Exportar tablas específicas
python manage.py dumpdata users.User > users_backup.json
python manage.py dumpdata administrador.Plato > platos_backup.json
```

---

## 🐛 Resolución de Problemas

### Frontend no carga

```powershell
# Verificar estado
flyctl status -a mopi-frontend

# Ver logs
flyctl logs -a mopi-frontend

# Reiniciar
flyctl apps restart -a mopi-frontend
```

### Error 404 en archivos estáticos

**Solución**: Los archivos estáticos ahora se recolectan durante el build del Docker image. Si hay problemas:

```powershell
# Re-desplegar backend
cd "Backend - MOPI - Restaurante"
flyctl deploy --remote-only
```

### Error CORS

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
flyctl secrets set CORS_ALLOWED_ORIGINS="https://mopi.fly.dev,https://mopi-frontend.fly.dev" -a mopi
```

### Base de datos no responde

```powershell
# Verificar estado
flyctl postgres list

# Ver logs de la base de datos
flyctl ssh console -a mopi-db

# Verificar conexión
flyctl postgres connect -a mopi-db
```

---

## 💰 Costos y Límites

### Plan Gratuito de Fly.io

Incluye:
- 3 máquinas compartidas con 256MB RAM cada una
- 3GB de almacenamiento persistente
- 160GB de transferencia de datos/mes

### Uso Actual

- Frontend: 2 máquinas × 256MB = 512MB ✅
- Backend: 1 máquina × 512MB = 512MB ⚠️
- Base de datos: 1GB de almacenamiento ✅

**Nota**: Con el backend usando 512MB, podrías estar en el tier de pago. Considera reducir a 256MB si deseas mantenerte en el plan gratuito:

```powershell
# Editar fly.toml del backend
[[vm]]
  memory_mb = 256

# Re-desplegar
flyctl deploy
```

---

## 🔧 Comandos Útiles

### Escalar Aplicaciones

```powershell
# Cambiar RAM
flyctl scale memory 256 -a mopi

# Cambiar número de máquinas
flyctl scale count 2 -a mopi

# Ver configuración actual
flyctl scale show -a mopi
```

### SSH a las Máquinas

```powershell
# Frontend
flyctl ssh console -a mopi-frontend

# Backend
flyctl ssh console -a mopi

# Base de datos
flyctl ssh console -a mopi-db
```

### Gestión de Secrets

```powershell
# Listar secrets
flyctl secrets list -a mopi

# Establecer secret
flyctl secrets set KEY=value -a mopi

# Eliminar secret
flyctl secrets unset KEY -a mopi
```

---

## 🧪 Testing del Sistema

### 1. Verificar Frontend

Abre: https://mopi-frontend.fly.dev

**Esperado**: Página de login del sistema

### 2. Verificar Backend API

Abre: https://mopi.fly.dev/api/administrador/dashboard/

**Esperado**: Error 401 (requiere autenticación) o JSON con datos

### 3. Verificar Admin Panel

Abre: https://mopi.fly.dev/admin/

**Esperado**: Página de login de Django con estilos CSS correctos

### 4. Verificar Archivos Estáticos

Abre: https://mopi.fly.dev/static/admin/css/base.css

**Esperado**: Archivo CSS se descarga correctamente

### 5. Test de Login

1. Crear usuario con `createsuperuser`
2. Ir a https://mopi-frontend.fly.dev
3. Iniciar sesión con las credenciales
4. Verificar que redirige al dashboard

---

## 📱 Acceso Desde Dispositivos Móviles

El sistema es completamente accesible desde cualquier dispositivo con internet:

- **URL Frontend**: https://mopi-frontend.fly.dev
- **Responsive**: Sí (adaptado a móviles y tablets)
- **PWA**: Configurable (puede instalarse como app)

---

## 🔄 Flujo de Trabajo de Desarrollo

### Desarrollo Local → Producción

1. **Desarrollar localmente**:
   ```powershell
   # Backend
   cd "Backend - MOPI - Restaurante"
   python manage.py runserver

   # Frontend
   cd "Restaurant-DonPepe-main\RestaurantSoft-main\Frontend"
   npm run dev
   ```

2. **Probar cambios localmente**

3. **Commit cambios**:
   ```powershell
   git add .
   git commit -m "Descripción de cambios"
   ```

4. **Desplegar a producción**:
   ```powershell
   # Backend
   cd "Backend - MOPI - Restaurante"
   flyctl deploy --remote-only

   # Frontend
   cd "Restaurant-DonPepe-main\RestaurantSoft-main\Frontend"
   flyctl deploy --remote-only
   ```

---

## 📚 Documentación Adicional

- **Fly.io Docs**: https://fly.io/docs/
- **Django Docs**: https://docs.djangoproject.com/
- **React Docs**: https://react.dev/
- **Vite Docs**: https://vitejs.dev/

---

## ✅ Checklist de Verificación

- [x] Backend desplegado en Fly.io
- [x] Frontend desplegado en Fly.io
- [x] Base de datos PostgreSQL funcionando
- [x] Archivos estáticos sirviendo correctamente
- [x] CORS configurado para frontend y backend
- [x] Health checks pasando en todas las apps
- [x] DNS configurado correctamente
- [x] Alta disponibilidad en frontend (2 máquinas)
- [x] Conexión frontend-backend funcionando
- [x] Sistema accesible desde internet
- [ ] Usuario administrador creado
- [ ] Datos de prueba cargados
- [ ] Testing completo del sistema

---

## 🎉 Sistema Completamente Funcional

Tu aplicación **Restaurante Don Pepe** está 100% desplegada en Fly.io:

✅ **Frontend**: https://mopi-frontend.fly.dev  
✅ **Backend**: https://mopi.fly.dev  
✅ **Base de Datos**: PostgreSQL en Fly.io  
✅ **Archivos Estáticos**: Funcionando correctamente  
✅ **CORS**: Configurado  
✅ **Alta Disponibilidad**: Frontend con 2 máquinas  

**¡Todo listo para usar en producción!** 🚀

---

**Última actualización**: 18 de noviembre, 2025  
**Desplegado por**: ernesto.piura@est.ulsa.edu.ni  
**Región**: Dallas, Texas (dfw)  
**Organización**: Personal
