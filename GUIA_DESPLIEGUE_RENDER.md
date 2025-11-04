# 🚀 Guía de Despliegue en Render - MOPI Restaurante Don Pepe

Esta guía te ayudará a desplegar el proyecto completo (Backend Django + Frontend React) en Render.

## 📋 Requisitos Previos

- Cuenta en [Render.com](https://render.com) (gratuita)
- Repositorio Git con el proyecto
- Base de datos PostgreSQL en Render (ya configurada)

## 🗄️ Base de Datos PostgreSQL

Ya tienes la base de datos configurada con estos datos:

```
Hostname: dpg-d4531qmuk2gs73frq7m0-a
Port: 5432
Username: base_de_datos_mopi_user
Password: ifet5AkTNHe9aIdEpXCaUQQFNM9oD0Sz
Internal Database URL: postgresql://base_de_datos_mopi_user:ifet5AkTNHe9aIdEpXCaUQQFNM9oD0Sz@dpg-d4531qmuk2gs73frq7m0-a/base_de_datos_mopi
```

## 🔧 Paso 1: Preparar el Backend

### 1.1 Verificar archivos necesarios

Asegúrate de que estos archivos existan en `Backend - MOPI - Restaurante/`:

- ✅ `requirements_updated.txt` - Dependencias de Python
- ✅ `build.sh` - Script de construcción
- ✅ `manage.py` - Gestor de Django
- ✅ `.env.example` - Ejemplo de variables de entorno

### 1.2 Crear Web Service para Backend

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub
4. Configura el servicio:

**Configuración básica:**
- **Name:** `mopi-backend`
- **Region:** Oregon (US West)
- **Branch:** `main`
- **Root Directory:** `Backend - MOPI - Restaurante`
- **Runtime:** Python 3
- **Build Command:**
  ```bash
  pip install -r requirements_updated.txt
  ```
- **Start Command:**
  ```bash
  python manage.py migrate && python manage.py collectstatic --no-input && gunicorn drfsimplecrud.wsgi:application
  ```

**Variables de Entorno:**

Agrega estas variables en la sección "Environment Variables":

```env
SECRET_KEY=tu-secret-key-generada-por-render
DEBUG=False
ALLOWED_HOSTS=.onrender.com
DATABASE_URL=postgresql://base_de_datos_mopi_user:ifet5AkTNHe9aIdEpXCaUQQFNM9oD0Sz@dpg-d4531qmuk2gs73frq7m0-a/base_de_datos_mopi
PYTHON_VERSION=3.12.0
CORS_ALLOWED_ORIGINS=https://tu-frontend.onrender.com
```

> **Nota:** Render generará automáticamente `RENDER_EXTERNAL_HOSTNAME`

### 1.3 Configurar Plan

- Selecciona el plan **Free** (gratuito)
- Click en **"Create Web Service"**

### 1.4 Esperar el despliegue

El despliegue tardará 5-10 minutos. Render ejecutará:
1. Instalación de dependencias
2. Migraciones de la base de datos
3. Recolección de archivos estáticos
4. Inicio del servidor Gunicorn

**URL del Backend:** `https://mopi-backend.onrender.com`

## 🎨 Paso 2: Desplegar el Frontend

### 2.1 Crear archivo .env para producción

En `Restaurant-DonPepe-main/RestaurantSoft-main/Frontend/`:

Crea un archivo `.env` (no .env.example):

```env
VITE_API_URL=https://mopi-backend.onrender.com
```

> ⚠️ **Importante:** Reemplaza `mopi-backend` con el nombre real de tu servicio backend

### 2.2 Crear Static Site para Frontend

1. En Render Dashboard, click **"New +"** → **"Static Site"**
2. Conecta tu repositorio de GitHub
3. Configura el servicio:

**Configuración básica:**
- **Name:** `mopi-frontend`
- **Region:** Oregon (US West)
- **Branch:** `main`
- **Root Directory:** `Restaurant-DonPepe-main/RestaurantSoft-main/Frontend`
- **Build Command:**
  ```bash
  npm install && npm run build
  ```
- **Publish Directory:** `dist`

**Variables de Entorno:**

```env
VITE_API_URL=https://mopi-backend.onrender.com
```

### 2.3 Configurar Rewrites y Headers

En la sección "Redirects/Rewrites", agrega:

```
/*  /index.html  200
```

Esto permite que React Router funcione correctamente.

### 2.4 Desplegar

- Click en **"Create Static Site"**
- El despliegue tardará 3-5 minutos

**URL del Frontend:** `https://mopi-frontend.onrender.com`

## 🔗 Paso 3: Conectar Backend y Frontend

### 3.1 Actualizar CORS en Backend

1. Ve a tu servicio backend en Render
2. En "Environment", actualiza la variable:

```env
CORS_ALLOWED_ORIGINS=https://mopi-frontend.onrender.com,http://localhost:5173
```

> Incluye localhost para seguir desarrollando localmente

3. Guarda y espera que se redespliegue automáticamente

### 3.2 Verificar la conexión

1. Abre tu frontend: `https://mopi-frontend.onrender.com`
2. Intenta hacer login
3. Si hay errores, revisa los logs del backend en Render

## 📊 Paso 4: Migrar Datos (Opcional)

Si tienes datos en tu base de datos local SQLite:

### 4.1 Exportar datos locales

```bash
cd "Backend - MOPI - Restaurante"
python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission --indent 2 > data_backup.json
```

### 4.2 Importar datos a Render

Usa el Shell de Render para importar:

1. Ve a tu servicio backend en Render
2. Click en "Shell" en el menú superior
3. Ejecuta:

```bash
python manage.py loaddata data_backup.json
```

## 🔒 Paso 5: Crear Superusuario

Para acceder al admin de Django en producción:

1. Ve a tu servicio backend en Render
2. Click en "Shell"
3. Ejecuta:

```bash
python manage.py createsuperuser
```

4. Accede a: `https://mopi-backend.onrender.com/admin/`

## 🧪 Paso 6: Verificar el Despliegue

### Checklist de verificación:

- [ ] Backend responde: `https://mopi-backend.onrender.com/admin/`
- [ ] Frontend carga: `https://mopi-frontend.onrender.com`
- [ ] Login funciona desde el frontend
- [ ] Las APIs responden correctamente
- [ ] No hay errores de CORS en la consola del navegador
- [ ] Los datos se guardan en PostgreSQL

## 🐛 Troubleshooting

### Problema: Error 500 en el backend

**Solución:**
1. Revisa los logs en Render Dashboard → Backend Service → Logs
2. Verifica que `DATABASE_URL` esté correctamente configurada
3. Asegúrate de que las migraciones se ejecutaron

### Problema: Error de CORS en frontend

**Solución:**
1. Verifica que `CORS_ALLOWED_ORIGINS` incluya la URL exacta del frontend
2. No incluyas `/` al final de la URL
3. Redesplega el backend después de cambiar variables

### Problema: Frontend no se conecta al backend

**Solución:**
1. Verifica que `VITE_API_URL` esté correctamente configurada
2. Abre la consola del navegador para ver errores
3. Redesplega el frontend después de cambiar variables

### Problema: Build falla en el backend

**Solución:**
1. Verifica que `requirements_updated.txt` tenga todas las dependencias
2. Revisa que `psycopg2-binary` esté incluido
3. Verifica la versión de Python en `PYTHON_VERSION`

## 🔄 Redespliegue

### Automático (recomendado)

Render redesplega automáticamente cuando haces push a `main`:

```bash
git add .
git commit -m "Actualización del proyecto"
git push origin main
```

### Manual

En Render Dashboard:
1. Ve a tu servicio
2. Click en "Manual Deploy" → "Deploy latest commit"

## 📝 Variables de Entorno - Resumen

### Backend:
```env
SECRET_KEY=<generado-por-render>
DEBUG=False
ALLOWED_HOSTS=.onrender.com
DATABASE_URL=postgresql://base_de_datos_mopi_user:ifet5AkTNHe9aIdEpXCaUQQFNM9oD0Sz@dpg-d4531qmuk2gs73frq7m0-a/base_de_datos_mopi
PYTHON_VERSION=3.12.0
CORS_ALLOWED_ORIGINS=https://mopi-frontend.onrender.com,http://localhost:5173
```

### Frontend:
```env
VITE_API_URL=https://mopi-backend.onrender.com
```

## 🎯 Próximos Pasos

1. ✅ Configurar dominio personalizado (opcional)
2. ✅ Configurar SSL (automático en Render)
3. ✅ Configurar monitoreo y alertas
4. ✅ Implementar backups automáticos de la base de datos
5. ✅ Optimizar rendimiento y caching

## 💡 Consejos Importantes

1. **Plan Free de Render:**
   - Los servicios gratuitos se "duermen" después de 15 minutos de inactividad
   - La primera petición después de dormir tardará ~30 segundos
   - Considera el plan Starter ($7/mes) para producción

2. **Base de Datos:**
   - El plan gratuito de PostgreSQL tiene límite de 90 días
   - Planifica migrar a un plan pagado o hacer backups regulares

3. **Logs:**
   - Revisa los logs regularmente en Render Dashboard
   - Configura alertas para errores críticos

4. **Seguridad:**
   - Nunca subas archivos `.env` al repositorio
   - Usa `.gitignore` para excluir información sensible
   - Cambia el `SECRET_KEY` regularmente

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs en Render Dashboard
2. Consulta la [documentación de Render](https://render.com/docs)
3. Revisa la consola del navegador para errores de frontend

---

**¡Felicidades! 🎉**

Tu aplicación MOPI - Restaurante Don Pepe está ahora desplegada en Render.

URLs de tu aplicación:
- Frontend: `https://mopi-frontend.onrender.com`
- Backend: `https://mopi-backend.onrender.com`
- Admin: `https://mopi-backend.onrender.com/admin/`
