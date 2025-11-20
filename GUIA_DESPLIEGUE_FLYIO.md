# 🚀 Guía de Despliegue en Fly.io - Restaurante Don Pepe

## ✅ Estado del Despliegue

**URL de Producción**: https://mopi.fly.dev

**Estado**: ✅ Desplegado y funcionando

---

## 📋 Información del Proyecto

- **App Name**: `mopi`
- **Región**: Dallas, Texas (dfw)
- **Base de Datos**: PostgreSQL (mopi-db)
- **VM**: Shared CPU, 1 CPU, 512 MB RAM

---

## 🔑 Credenciales de Base de Datos

### PostgreSQL en Fly.io
- **Cluster**: mopi-db
- **Usuario**: postgres
- **Password**: `WZ35DgssRHtEedW`
- **Hostname**: mopi-db.flycast
- **Puerto**: 5432
- **Connection String**: `postgres://postgres:WZ35DgssRHtEedW@mopi-db.flycast:5432`

**⚠️ IMPORTANTE**: Guarda estas credenciales en un lugar seguro. No las compartas públicamente.

---

## 📁 Archivos de Configuración

### `fly.toml`
Archivo principal de configuración de Fly.io con:
- Nombre de la app
- Región de despliegue
- Configuración de build (Dockerfile.fly)
- Variables de entorno
- Health checks
- Comandos de release

### `Dockerfile.fly`
Dockerfile optimizado para Fly.io que:
- Usa Python 3.12
- Instala dependencias del sistema (PostgreSQL, build-essential)
- Copia requirements_updated.txt
- Configura gunicorn con 2 workers

### `release.sh`
Script que se ejecuta antes de cada despliegue:
- Ejecuta migraciones de base de datos
- Recolecta archivos estáticos
- Carga datos de producción

---

## 🔧 Variables de Entorno Configuradas

Las siguientes variables están configuradas como secretos en Fly.io:

- `DATABASE_URL`: Configurada automáticamente al adjuntar PostgreSQL
- `SECRET_KEY`: Clave secreta de Django (generada automáticamente)
- `ALLOWED_HOSTS`: `mopi.fly.dev,*.fly.dev,.fly.dev,172.19.22.218`
- `CORS_ALLOWED_ORIGINS`: `https://mopi.fly.dev`
- `DEBUG`: `False` (configurado en fly.toml)

---

## 🚀 Comandos Útiles

### Ver estado de la aplicación
```bash
flyctl status -a mopi
```

### Ver logs en tiempo real
```bash
flyctl logs -a mopi
```

### Ver logs sin seguimiento
```bash
flyctl logs -a mopi -n
```

### Abrir la aplicación en el navegador
```bash
flyctl apps open -a mopi
```

### Acceder por SSH a la máquina
```bash
flyctl ssh console -a mopi
```

### Ver información de la base de datos
```bash
flyctl postgres list
flyctl postgres info mopi-db
```

### Desplegar una nueva versión
```bash
cd "Backend - MOPI - Restaurante"
flyctl deploy --remote-only
```

### Actualizar variables de entorno
```bash
flyctl secrets set NOMBRE_VARIABLE="valor" -a mopi
```

### Ver todas las variables de entorno
```bash
flyctl secrets list -a mopi
```

### Escalar la aplicación (cambiar recursos)
```bash
# Aumentar memoria
flyctl scale memory 1024 -a mopi

# Aumentar CPUs
flyctl scale count 2 -a mopi
```

### Reiniciar la aplicación
```bash
flyctl apps restart -a mopi
```

---

## 🔄 Proceso de Actualización

Para desplegar cambios en tu código:

1. **Hacer commit de tus cambios**:
   ```bash
   git add .
   git commit -m "Descripción de cambios"
   ```

2. **Desplegar a Fly.io**:
   ```bash
   cd "Backend - MOPI - Restaurante"
   flyctl deploy --remote-only
   ```

3. **Verificar el despliegue**:
   ```bash
   flyctl status -a mopi
   flyctl logs -a mopi
   ```

---

## 🗄️ Gestión de Base de Datos

### Conectarse a la base de datos
```bash
flyctl postgres connect -a mopi-db
```

### Ejecutar comandos de Django
```bash
# Conectarse por SSH
flyctl ssh console -a mopi

# Dentro de la máquina
python manage.py shell
python manage.py createsuperuser
python manage.py migrate
```

### Backup de la base de datos
```bash
# Crear backup
flyctl postgres backup create -a mopi-db

# Ver backups
flyctl postgres backup list -a mopi-db
```

---

## 🐛 Resolución de Problemas

### La app no responde
1. Verificar estado: `flyctl status -a mopi`
2. Ver logs: `flyctl logs -a mopi`
3. Reiniciar: `flyctl apps restart -a mopi`

### Error de ALLOWED_HOSTS
Si ves errores de "Invalid HTTP_HOST header", actualiza ALLOWED_HOSTS:
```bash
flyctl secrets set ALLOWED_HOSTS="mopi.fly.dev,*.fly.dev,.fly.dev,172.19.22.218" -a mopi
```

### Error de base de datos
1. Verificar que la base de datos esté corriendo: `flyctl postgres info mopi-db`
2. Verificar la conexión: `flyctl postgres connect -a mopi-db`
3. Revisar la variable DATABASE_URL: `flyctl secrets list -a mopi`

### Health checks fallando
1. Ver logs para identificar el error
2. Verificar que la ruta `/admin/login/` esté accesible
3. Ajustar el timeout en `fly.toml` si es necesario

---

## 📊 Monitoreo

### Dashboard de Fly.io
Visita: https://fly.io/apps/mopi/monitoring

Aquí puedes ver:
- Métricas de CPU y memoria
- Tráfico de red
- Logs en tiempo real
- Estado de las máquinas

### Métricas en terminal
```bash
# Ver uso de recursos
flyctl status -a mopi

# Ver métricas detalladas
flyctl vm status -a mopi
```

---

## 💰 Costos

Fly.io ofrece un tier gratuito que incluye:
- 3 máquinas compartidas con 256MB RAM (estás usando 1 con 512MB)
- 3GB de almacenamiento persistente (estás usando 1GB para PostgreSQL)
- 160GB de transferencia de datos

**⚠️ Nota**: Con la configuración actual (512MB RAM), podrías estar en el tier de pago. Verifica tu uso en: https://fly.io/dashboard/personal/billing

---

## 🔐 Seguridad

### Recomendaciones
1. ✅ DEBUG está en False en producción
2. ✅ SECRET_KEY es único y seguro
3. ✅ Base de datos usa conexión segura
4. ✅ ALLOWED_HOSTS está correctamente configurado
5. ⚠️ Considera agregar HTTPS estricto en settings.py:
   ```python
   SECURE_SSL_REDIRECT = True
   SESSION_COOKIE_SECURE = True
   CSRF_COOKIE_SECURE = True
   ```

### Rotar SECRET_KEY
```bash
flyctl secrets set SECRET_KEY="nueva-clave-secreta-muy-larga-y-aleatoria" -a mopi
```

---

## 🆘 Soporte

- **Documentación Fly.io**: https://fly.io/docs/
- **Comunidad Fly.io**: https://community.fly.io/
- **Status de Fly.io**: https://status.flyio.net/

---

## 📝 Notas Adicionales

- El despliegue se realiza desde el código local (no desde Git)
- Los builds se hacen de forma remota (--remote-only)
- La base de datos persiste entre despliegues
- Los archivos estáticos se sirven con WhiteNoise
- Gunicorn maneja las solicitudes HTTP en producción

---

**Última actualización**: 18 de noviembre, 2025
**Desplegado por**: ernesto.piura@est.ulsa.edu.ni
