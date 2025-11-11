# 🚀 Comandos Rápidos de Docker - MOPI

## 📌 Comandos Esenciales

### Iniciar todo el stack
```powershell
cd d:\ULSA\MOPI
docker compose up --build -d
```

### Ver el estado
```powershell
docker compose ps
```

### Ver logs
```powershell
# Todos los servicios
docker compose logs -f

# Solo backend
docker compose logs -f backend

# Solo frontend
docker compose logs -f frontend
```

### Detener todo
```powershell
docker compose down
```

### Reiniciar servicios
```powershell
docker compose restart
```

---

## 🛠️ Comandos de Mantenimiento Backend

### Ejecutar migraciones
```powershell
docker compose exec backend python manage.py migrate
```

### Cargar datos iniciales
```powershell
docker compose exec backend python manage.py populate_all_data
```

### Crear superusuario
```powershell
docker compose exec backend python manage.py createsuperuser
```

### Acceder al shell de Django
```powershell
docker compose exec backend python manage.py shell
```

### Recolectar archivos estáticos
```powershell
docker compose exec backend python manage.py collectstatic --noinput
```

---

## 🗄️ Comandos de Base de Datos

### Acceder a PostgreSQL
```powershell
docker compose exec db psql -U mopi_user -d mopi_db
```

### Backup de la base de datos
```powershell
docker compose exec db pg_dump -U mopi_user mopi_db > backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql
```

### Restaurar backup
```powershell
Get-Content backup_20241111_120000.sql | docker compose exec -T db psql -U mopi_user -d mopi_db
```

### Ver tablas
```sql
-- Desde psql
\dt
```

### Ver conexiones activas
```powershell
docker compose exec db psql -U mopi_user -d mopi_db -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## 🧹 Comandos de Limpieza

### Detener y eliminar contenedores (mantiene datos)
```powershell
docker compose down
```

### Eliminar TODO incluyendo volúmenes (⚠️ CUIDADO)
```powershell
docker compose down -v
```

### Reconstruir desde cero
```powershell
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### Ver uso de espacio en disco
```powershell
docker system df
```

### Limpiar imágenes no utilizadas
```powershell
docker image prune -a
```

---

## 📊 Comandos de Monitoreo

### Ver uso de recursos
```powershell
docker stats
```

### Ver logs de los últimos 100 líneas
```powershell
docker compose logs --tail=100
```

### Inspeccionar un contenedor
```powershell
docker compose exec backend env
```

### Ver procesos en un contenedor
```powershell
docker compose exec backend ps aux
```

---

## 🔧 Comandos de Desarrollo

### Reconstruir solo el backend
```powershell
docker compose up --build -d backend
```

### Reconstruir solo el frontend
```powershell
docker compose up --build -d frontend
```

### Acceder a bash en el backend
```powershell
docker compose exec backend bash
```

### Acceder a shell en el frontend
```powershell
docker compose exec frontend sh
```

---

## 🎯 Script PowerShell (Método Alternativo)

### Usar el script auxiliar
```powershell
# Ver ayuda
.\docker-start.ps1 help

# Iniciar servicios
.\docker-start.ps1 up

# Ver logs
.\docker-start.ps1 logs

# Ver estado
.\docker-start.ps1 status

# Detener servicios
.\docker-start.ps1 down

# Backup de BD
.\docker-start.ps1 backup
```

---

## 🌐 URLs de Acceso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Admin Django**: http://localhost:8000/admin
- **PostgreSQL**: localhost:5432

---

## 🐛 Solución Rápida de Problemas

### Puerto ocupado
```powershell
# Ver qué está usando el puerto 8000
netstat -ano | findstr :8000

# Matar proceso por PID
taskkill /PID <numero_pid> /F
```

### Reiniciar Docker Desktop
```powershell
# Detener servicios primero
docker compose down

# Luego reinicia Docker Desktop desde el menú
```

### Ver errores específicos
```powershell
docker compose logs backend --tail=50
```

### Verificar conectividad entre servicios
```powershell
docker compose exec backend ping db
docker compose exec backend curl http://db:5432
```

---

## 📝 Notas Importantes

1. **Siempre ejecuta los comandos desde**: `d:\ULSA\MOPI`
2. **Los datos persisten** en volúmenes Docker hasta que ejecutes `docker compose down -v`
3. **Las variables de entorno** se cargan desde `.env.backend` y `.env.frontend`
4. **El script entrypoint.sh** ejecuta migraciones automáticamente al iniciar

---

## ✅ Checklist Post-Despliegue

- [ ] Todos los contenedores están "Up": `docker compose ps`
- [ ] Backend responde: `curl http://localhost:8000`
- [ ] Frontend carga: Abre http://localhost:5173 en el navegador
- [ ] Admin funciona: http://localhost:8000/admin
- [ ] Base de datos tiene datos: Verifica en el admin

---

**¡Listo para trabajar! 🎉**
