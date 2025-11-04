# ✅ Checklist de Despliegue - MOPI Restaurante Don Pepe

## 📦 Pre-Despliegue

### Backend
- [x] Configuración de PostgreSQL actualizada en `settings.py`
- [x] `dj_database_url` habilitado
- [x] CORS configurado con variables de entorno
- [x] `requirements_updated.txt` completo
- [x] `build.sh` listo
- [x] `.env.example` creado
- [ ] `SECRET_KEY` generada para producción
- [ ] Verificar que todas las apps estén en `INSTALLED_APPS`

### Frontend
- [x] Archivo `src/config/api.js` creado
- [x] Componentes actualizados para usar `API_ENDPOINTS`
- [x] `.env.example` creado
- [ ] Crear archivo `.env` con `VITE_API_URL`
- [ ] Verificar que `npm run build` funcione localmente
- [ ] Eliminar `console.log` innecesarios

### Repositorio
- [x] `.gitignore` configurado
- [x] Código subido a GitHub
- [ ] Verificar que no haya archivos `.env` en el repositorio
- [ ] README actualizado

## 🚀 Despliegue en Render

### 1. Backend (Web Service)

- [ ] Crear nuevo Web Service en Render
- [ ] Conectar repositorio de GitHub
- [ ] Configurar:
  ```
  Name: mopi-backend
  Region: Oregon
  Branch: main
  Root Directory: Backend - MOPI - Restaurante
  Runtime: Python 3
  ```
- [ ] Build Command:
  ```bash
  pip install -r requirements_updated.txt
  ```
- [ ] Start Command:
  ```bash
  python manage.py migrate && python manage.py collectstatic --no-input && gunicorn drfsimplecrud.wsgi:application
  ```
- [ ] Agregar variables de entorno:
  - [ ] `SECRET_KEY` (generar nueva)
  - [ ] `DEBUG=False`
  - [ ] `ALLOWED_HOSTS=.onrender.com`
  - [ ] `DATABASE_URL=postgresql://base_de_datos_mopi_user:ifet5AkTNHe9aIdEpXCaUQQFNM9oD0Sz@dpg-d4531qmuk2gs73frq7m0-a/base_de_datos_mopi`
  - [ ] `PYTHON_VERSION=3.12.0`
  - [ ] `CORS_ALLOWED_ORIGINS=` (actualizar después de desplegar frontend)
- [ ] Seleccionar plan Free
- [ ] Click "Create Web Service"
- [ ] Esperar despliegue (5-10 min)
- [ ] Verificar que `/admin/` carga correctamente
- [ ] **Anotar URL del backend:** `https://_________.onrender.com`

### 2. Frontend (Static Site)

- [ ] Actualizar `.env` en el frontend:
  ```env
  VITE_API_URL=https://[URL-DEL-BACKEND]
  ```
- [ ] Commit y push del cambio
- [ ] Crear nuevo Static Site en Render
- [ ] Configurar:
  ```
  Name: mopi-frontend
  Region: Oregon
  Branch: main
  Root Directory: Restaurant-DonPepe-main/RestaurantSoft-main/Frontend
  ```
- [ ] Build Command:
  ```bash
  npm install && npm run build
  ```
- [ ] Publish Directory: `dist`
- [ ] Agregar variable de entorno:
  - [ ] `VITE_API_URL=https://[URL-DEL-BACKEND]`
- [ ] Configurar Redirects/Rewrites:
  ```
  /*  /index.html  200
  ```
- [ ] Seleccionar plan Free
- [ ] Click "Create Static Site"
- [ ] Esperar despliegue (3-5 min)
- [ ] **Anotar URL del frontend:** `https://_________.onrender.com`

### 3. Conectar Backend y Frontend

- [ ] Actualizar `CORS_ALLOWED_ORIGINS` en el backend:
  ```env
  CORS_ALLOWED_ORIGINS=https://[URL-FRONTEND],http://localhost:5173
  ```
- [ ] Guardar cambios (el backend se redespliegará automáticamente)
- [ ] Esperar redespliegue del backend

## 🧪 Verificación Post-Despliegue

### Backend
- [ ] Abrir `https://[BACKEND]/admin/`
- [ ] Verificar que carga sin errores 500
- [ ] Revisar logs en Render Dashboard

### Frontend
- [ ] Abrir `https://[FRONTEND]`
- [ ] Verificar que carga la página de login
- [ ] Abrir DevTools Console
- [ ] Verificar que no hay errores de CORS
- [ ] Verificar que no hay errores 404

### Integración
- [ ] Intentar hacer login desde el frontend
- [ ] Verificar que la autenticación funciona
- [ ] Verificar que las APIs responden correctamente
- [ ] Probar navegación entre módulos
- [ ] Verificar que los datos se guardan en PostgreSQL

## 🔒 Seguridad Post-Despliegue

- [ ] Crear superusuario en producción (via Shell de Render)
- [ ] Cambiar contraseñas por defecto
- [ ] Verificar que `DEBUG=False` en backend
- [ ] Verificar que no se exponen datos sensibles en logs
- [ ] Verificar que `.env` no está en el repositorio

## 📊 Configuración Adicional

### Crear Superusuario
- [ ] Ir a Backend Service en Render
- [ ] Click en "Shell"
- [ ] Ejecutar: `python manage.py createsuperuser`
- [ ] Ingresar credenciales
- [ ] Probar acceso a `/admin/`

### Migrar Datos (Opcional)
- [ ] Exportar datos de SQLite local:
  ```bash
  python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission --indent 2 > data_backup.json
  ```
- [ ] Subir archivo a repositorio o servidor
- [ ] Importar en Render via Shell:
  ```bash
  python manage.py loaddata data_backup.json
  ```

## 📝 URLs Finales

Anota tus URLs de producción:

```
Backend:  https://________________________.onrender.com
Frontend: https://________________________.onrender.com
Admin:    https://________________________.onrender.com/admin/
```

## 🎯 Próximos Pasos

- [ ] Configurar dominio personalizado (opcional)
- [ ] Configurar monitoreo de uptime
- [ ] Configurar backups automáticos de DB
- [ ] Documentar proceso de actualización
- [ ] Crear pipeline de CI/CD (opcional)

## 🐛 Troubleshooting Común

### Backend no inicia
- Revisar logs en Render Dashboard
- Verificar `DATABASE_URL`
- Verificar que las migraciones se ejecutaron

### Frontend no se conecta
- Verificar `VITE_API_URL` en variables de entorno
- Verificar CORS en backend
- Revisar console del navegador

### Error 500 en backend
- Revisar logs detallados
- Verificar `SECRET_KEY`
- Verificar conexión a PostgreSQL

### Servicio se duerme (plan Free)
- Normal en plan gratuito
- Primera petición tardará ~30 segundos
- Considerar plan Starter ($7/mes) para producción

---

**Última actualización:** ${new Date().toLocaleDateString()}

**Estado:** [ ] Listo para desplegar | [ ] Desplegado | [ ] Verificado
