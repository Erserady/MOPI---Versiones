# 🚀 Guía de Desarrollo Local con Docker

Esta guía te ayudará a ejecutar el proyecto completo (Backend + Frontend + Base de Datos) en tu máquina local usando Docker.

## 📋 Requisitos previos

1. **Docker Desktop** instalado y en ejecución
   - Descarga: https://www.docker.com/products/docker-desktop/
   - Asegúrate de que Docker Desktop esté corriendo (ícono de la ballena en la bandeja del sistema)

2. **Git** (ya lo tienes instalado)

## 🛠️ Configuración inicial (solo la primera vez)

### 1. Crear archivo de variables de entorno

Copia el archivo de ejemplo y ajusta si es necesario:

```bash
# Desde la raíz del proyecto (d:\ULSA\MOPI)
copy .env.backend.example .env.backend
```

El archivo `.env.backend` ya viene con valores adecuados para desarrollo local. No necesitas modificarlo a menos que quieras cambiar credenciales.

### 2. Verificar que Docker Desktop está corriendo

Abre Docker Desktop y asegúrate de que está iniciado.

## 🚀 Comandos para trabajar localmente

### Iniciar todo el entorno (primera vez)

```bash
# Desde d:\ULSA\MOPI
docker-compose up --build
```

Este comando:
- ✅ Construye las imágenes de Docker
- ✅ Inicia PostgreSQL
- ✅ Inicia el Backend Django
- ✅ Inicia el Frontend React
- ✅ Ejecuta migraciones automáticamente
- ✅ Crea un superusuario (admin/mopi2024)

### Iniciar el entorno (después de la primera vez)

```bash
# Sin rebuild (más rápido)
docker-compose up
```

### Detener el entorno

```bash
# Opción 1: Ctrl + C en la terminal donde está corriendo
# Opción 2: En otra terminal
docker-compose down
```

### Ver logs de un servicio específico

```bash
# Ver logs del backend
docker-compose logs -f backend

# Ver logs del frontend
docker-compose logs -f frontend

# Ver logs de la base de datos
docker-compose logs -f db
```

### Reconstruir después de cambios en el código

```bash
# Si modificaste código de Python o JavaScript
docker-compose up --build

# O reconstruir un servicio específico
docker-compose up --build backend
```

## 🌐 URLs de acceso

Una vez que el entorno esté corriendo:

- **Frontend (React)**: http://localhost:5173
- **Backend API (Django)**: http://localhost:8000
- **Admin Django**: http://localhost:8000/admin
  - Usuario: `admin`
  - Contraseña: `mopi2024`
- **Base de datos PostgreSQL**: `localhost:5432`
  - Base de datos: `mopi_db`
  - Usuario: `mopi_user`
  - Contraseña: `mopi_pass`

## 🔄 Workflow de desarrollo

### 1. Hacer cambios en el código

#### Cambios en el Frontend (React)
- Edita archivos en `Restaurant-DonPepe-main/RestaurantSoft-main/Frontend/src/`
- **Debes reconstruir**: `docker-compose up --build frontend`

#### Cambios en el Backend (Django)
- Edita archivos en `Backend - MOPI - Restaurante/`
- Para cambios en código Python: `docker-compose restart backend`
- Para cambios en modelos: necesitas crear migraciones (ver abajo)

### 2. Crear migraciones de base de datos

Si modificaste modelos en Django:

```bash
# Crear migraciones
docker-compose exec backend python manage.py makemigrations

# Aplicar migraciones
docker-compose exec backend python manage.py migrate
```

### 3. Probar cambios localmente

1. Abre http://localhost:5173 en tu navegador
2. Prueba la funcionalidad que modificaste
3. Verifica que todo funcione correctamente

### 4. Desplegar a producción (Fly.io)

Una vez que hayas probado localmente:

```bash
# Desplegar backend
cd "Backend - MOPI - Restaurante"
flyctl deploy --config fly.toml

# Desplegar frontend
cd "../Restaurant-DonPepe-main/RestaurantSoft-main/Frontend"
flyctl deploy --config fly.toml
```

## 🐛 Solución de problemas

### Error: "Cannot connect to Docker daemon"

**Solución**: Abre Docker Desktop y espera a que inicie completamente.

### Error: "Port already in use"

**Solución**: Otro proceso está usando el puerto. Opciones:

1. Detener el proceso que usa el puerto
2. O cambiar el puerto en `docker-compose.yml`:
   ```yaml
   ports:
     - "8001:8000"  # Cambiar 8000 a 8001
   ```

### Error: "Database connection refused"

**Solución**: 
```bash
# Reiniciar servicios
docker-compose down
docker-compose up
```

### Limpiar completamente el entorno

Si algo está muy roto:

```bash
# Detener y eliminar todo (incluyendo volúmenes)
docker-compose down -v

# Limpiar imágenes viejas
docker system prune -a

# Iniciar de nuevo
docker-compose up --build
```

### Ver el estado de los contenedores

```bash
docker-compose ps
```

## 📊 Comandos útiles de Django

```bash
# Acceder a la shell de Django
docker-compose exec backend python manage.py shell

# Crear superusuario adicional
docker-compose exec backend python manage.py createsuperuser

# Ejecutar tests
docker-compose exec backend python manage.py test

# Ver migraciones pendientes
docker-compose exec backend python manage.py showmigrations
```

## 🔐 Acceso a la base de datos

Puedes conectarte a PostgreSQL con cualquier cliente (DBeaver, pgAdmin, etc.):

- **Host**: localhost
- **Puerto**: 5432
- **Base de datos**: mopi_db
- **Usuario**: mopi_user
- **Contraseña**: mopi_pass

## 📝 Notas importantes

1. **Los cambios en código se reflejan automáticamente** en el backend (Django tiene auto-reload)
2. **El frontend necesita rebuild** después de cambios porque usa build de producción
3. **Los datos se persisten** en volúmenes de Docker, no se pierden al reiniciar
4. **Siempre prueba localmente** antes de desplegar a producción

## 🎯 Resumen del flujo de trabajo diario

```bash
# 1. Iniciar Docker Desktop (si no está corriendo)

# 2. Iniciar el entorno
docker-compose up

# 3. Hacer cambios en el código

# 4. Si modificaste frontend, reconstruir:
docker-compose up --build frontend

# 5. Si modificaste backend, reiniciar:
docker-compose restart backend

# 6. Probar en http://localhost:5173

# 7. Si todo funciona, desplegar a producción
# (ver comandos de Fly.io arriba)

# 8. Al terminar
docker-compose down
```

## ❓ ¿Necesitas ayuda?

Si encuentras errores:

1. Revisa los logs: `docker-compose logs -f`
2. Verifica que Docker Desktop esté corriendo
3. Asegúrate de estar en el directorio correcto: `d:\ULSA\MOPI`
4. Intenta limpiar y reconstruir: `docker-compose down -v && docker-compose up --build`
