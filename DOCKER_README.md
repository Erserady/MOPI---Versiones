# 🐳 Guía de Despliegue con Docker - Restaurante Don Pepe

Esta guía te ayudará a desplegar el proyecto completo usando Docker y Docker Compose.

## 📋 Requisitos Previos

- **Docker Desktop** instalado (Windows/Mac) o **Docker Engine** (Linux)
- **Docker Compose** v2.0 o superior
- **Git** (para clonar/actualizar el repositorio)

Verifica que Docker esté instalado:
```bash
docker --version
docker compose version
```

---

## 🏗️ Arquitectura del Stack

El proyecto está compuesto por 3 servicios:

1. **PostgreSQL 16** - Base de datos (puerto 5432)
2. **Django Backend** - API REST con DRF (puerto 8000)
3. **React Frontend** - Interfaz web con Vite + Nginx (puerto 5173)

---

## 🚀 Inicio Rápido - Desarrollo Local

### 1. Posicionarse en la raíz del proyecto

```bash
cd d:\ULSA\MOPI
```

### 2. Construir y levantar los contenedores

```bash
docker compose up --build -d
```

Este comando:
- ✅ Descarga las imágenes base necesarias
- ✅ Construye las imágenes del backend y frontend
- ✅ Crea la base de datos PostgreSQL
- ✅ Ejecuta las migraciones automáticamente
- ✅ Carga los datos iniciales con `populate_all_data`
- ✅ Inicia todos los servicios en segundo plano

### 3. Verificar que todo esté corriendo

```bash
docker compose ps
```

Deberías ver 3 contenedores en estado "Up":
- `mopi_postgres`
- `mopi_backend`
- `mopi_frontend`

### 4. Acceder a la aplicación

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Admin Django**: http://localhost:8000/admin

---

## 📝 Comandos Útiles

### Ver logs en tiempo real

```bash
# Todos los servicios
docker compose logs -f

# Solo backend
docker compose logs -f backend

# Solo frontend
docker compose logs -f frontend

# Solo base de datos
docker compose logs -f db
```

### Detener los contenedores

```bash
docker compose stop
```

### Reiniciar los contenedores

```bash
docker compose restart
```

### Detener y eliminar contenedores (mantiene volúmenes)

```bash
docker compose down
```

### Detener y eliminar TODO (incluye volúmenes y datos)

```bash
docker compose down -v
```

⚠️ **CUIDADO**: Esto eliminará TODOS los datos de la base de datos.

---

## 🛠️ Comandos de Mantenimiento

### Ejecutar migraciones manualmente

```bash
docker compose exec backend python manage.py migrate
```

### Cargar datos iniciales

```bash
docker compose exec backend python manage.py populate_all_data
```

### Crear superusuario

```bash
docker compose exec backend python manage.py createsuperuser
```

### Acceder al shell de Django

```bash
docker compose exec backend python manage.py shell
```

### Acceder a la base de datos PostgreSQL

```bash
docker compose exec db psql -U mopi_user -d mopi_db
```

### Recolectar archivos estáticos

```bash
docker compose exec backend python manage.py collectstatic --noinput
```

### Ver archivos en el contenedor

```bash
docker compose exec backend ls -la
docker compose exec frontend ls -la /usr/share/nginx/html
```

---

## 🔄 Actualizar el Código

Si haces cambios en el código:

### Solo cambios en código Python (backend)

```bash
docker compose restart backend
```

### Solo cambios en código React (frontend)

```bash
docker compose up --build frontend -d
```

### Cambios en dependencias (requirements.txt o package.json)

```bash
docker compose up --build -d
```

---

## 🐛 Solución de Problemas

### El backend no se conecta a la base de datos

```bash
# Verificar que PostgreSQL esté corriendo
docker compose ps db

# Ver logs de la base de datos
docker compose logs db

# Verificar healthcheck
docker compose exec db pg_isready -U mopi_user
```

### Error "port already in use"

Si los puertos 5432, 8000 o 5173 están ocupados:

1. Detén otros servicios que usen esos puertos
2. O modifica los puertos en `docker-compose.yml`:

```yaml
ports:
  - "8001:8000"  # Cambiar puerto externo
```

### Reconstruir desde cero

```bash
# Detener y eliminar todo
docker compose down -v

# Eliminar imágenes antiguas
docker compose rm -f
docker rmi mopi_backend mopi_frontend

# Reconstruir
docker compose up --build -d
```

### Ver uso de recursos

```bash
docker stats
```

---

## 📦 Backup y Restauración

### Backup de la base de datos

```bash
docker compose exec db pg_dump -U mopi_user mopi_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar backup

```bash
docker compose exec -T db psql -U mopi_user -d mopi_db < backup_20241111_120000.sql
```

### Backup del volumen de datos

```bash
docker run --rm -v mopi_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/pgdata_backup.tar.gz /data
```

---

## 🌍 Despliegue en Producción

### 1. Preparar variables de entorno

Copia `.env.production.example` a `.env.backend` y ajusta los valores:

```bash
cp .env.production.example .env.backend
```

Edita `.env.backend` con:
- `SECRET_KEY` único y seguro
- `DATABASE_URL` de tu PostgreSQL gestionado
- `ALLOWED_HOSTS` con tu dominio
- `CORS_ALLOWED_ORIGINS` con la URL de tu frontend

### 2. Construir imágenes para producción

```bash
docker compose -f docker-compose.yml build
```

### 3. Subir imágenes a un registro

```bash
# Docker Hub
docker tag mopi_backend:latest tu-usuario/mopi-backend:latest
docker tag mopi_frontend:latest tu-usuario/mopi-frontend:latest
docker push tu-usuario/mopi-backend:latest
docker push tu-usuario/mopi-frontend:latest

# GitHub Container Registry
docker tag mopi_backend:latest ghcr.io/tu-usuario/mopi-backend:latest
docker tag mopi_frontend:latest ghcr.io/tu-usuario/mopi-frontend:latest
docker push ghcr.io/tu-usuario/mopi-backend:latest
docker push ghcr.io/tu-usuario/mopi-frontend:latest
```

### 4. Desplegar en servidor

En tu servidor de producción:

```bash
# Crear .env.backend con variables de producción
nano .env.backend

# Descargar docker-compose.yml
# Modificar docker-compose.yml para usar las imágenes del registro

# Levantar servicios
docker compose up -d
```

### 5. Configurar HTTPS

Usa **Traefik**, **Caddy** o **Nginx Proxy** para añadir certificados SSL.

---

## 📊 Monitoreo

### Ver estado de salud

```bash
docker compose ps
docker inspect --format='{{json .State.Health}}' mopi_postgres
```

### Uso de recursos por contenedor

```bash
docker stats mopi_backend mopi_frontend mopi_postgres
```

### Verificar conexiones a la base de datos

```bash
docker compose exec db psql -U mopi_user -d mopi_db -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs: `docker compose logs -f`
2. Verifica el estado: `docker compose ps`
3. Revisa la configuración de `.env.backend`
4. Asegúrate de que Docker Desktop esté corriendo

---

## 📚 Recursos Adicionales

- [Documentación de Docker Compose](https://docs.docker.com/compose/)
- [Django en Docker](https://docs.docker.com/samples/django/)
- [PostgreSQL en Docker](https://hub.docker.com/_/postgres)
- [Nginx](https://nginx.org/en/docs/)

---

## ✅ Checklist de Producción

Antes de desplegar en producción, verifica:

- [ ] `SECRET_KEY` única y segura en `.env.backend`
- [ ] `DEBUG=False` en producción
- [ ] `ALLOWED_HOSTS` configurado correctamente
- [ ] `DATABASE_URL` apunta a PostgreSQL gestionado (no SQLite)
- [ ] CORS configurado con las URLs correctas
- [ ] HTTPS configurado (Traefik/Caddy/Nginx)
- [ ] Backups automáticos de la base de datos configurados
- [ ] Monitoreo y alertas configurados
- [ ] Variables sensibles NO están en el repositorio
- [ ] `.env.backend` está en `.gitignore`

---

**¡Listo! Tu proyecto está dockerizado y listo para producción. 🎉**
