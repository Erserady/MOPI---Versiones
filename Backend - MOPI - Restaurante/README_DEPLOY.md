# Backend - MOPI Restaurante Don Pepe

## 🚀 Despliegue en Render

### Comandos de construcción

```bash
pip install -r requirements_updated.txt
```

### Comando de inicio

```bash
python manage.py migrate && python manage.py collectstatic --no-input && gunicorn drfsimplecrud.wsgi:application
```

### Variables de Entorno Requeridas

```env
SECRET_KEY=<tu-secret-key>
DEBUG=False
ALLOWED_HOSTS=.onrender.com
DATABASE_URL=<tu-url-postgresql>
PYTHON_VERSION=3.12.0
CORS_ALLOWED_ORIGINS=<url-frontend>,http://localhost:5173
```

### Estructura del proyecto

```
Backend - MOPI - Restaurante/
├── drfsimplecrud/         # Configuración principal de Django
│   ├── settings.py        # Configuración (DB, CORS, etc.)
│   ├── urls.py           # Rutas principales
│   └── wsgi.py           # Entry point para Gunicorn
├── users/                # App de usuarios y autenticación
├── cocina/               # App módulo cocina
├── mesero/               # App módulo meseros
├── caja/                 # App módulo caja
├── administrador/        # App módulo administrador
├── projects/             # App de proyectos
├── manage.py             # Gestor de Django
├── requirements_updated.txt  # Dependencias Python
├── build.sh              # Script de construcción
└── .env.example          # Ejemplo de variables de entorno
```

## 🔧 Desarrollo Local

### 1. Crear entorno virtual

```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

### 2. Instalar dependencias

```bash
pip install -r requirements_updated.txt
```

### 3. Configurar variables de entorno

Copia `.env.example` a `.env` y configura:

```env
SECRET_KEY=tu-secret-key-desarrollo
DEBUG=True
DATABASE_URL=  # Dejar vacío para usar SQLite
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### 4. Migraciones

```bash
python manage.py migrate
```

### 5. Crear superusuario

```bash
python manage.py createsuperuser
```

### 6. Ejecutar servidor

```bash
python manage.py runserver
```

El backend estará disponible en: `http://localhost:8000`

## 📚 API Endpoints

### Autenticación
- `POST /api/users/login/` - Login de usuario
- `POST /api/users/verify-pin/` - Verificar PIN

### Usuarios
- `GET /api/users/by-role/?role={role}` - Obtener usuarios por rol
  - Roles: `admin`, `cook`, `waiter`, `cashier`

### Admin
- `GET /admin/` - Panel de administración de Django

## 🗄️ Base de Datos

### Desarrollo
- SQLite (automático cuando no hay `DATABASE_URL`)
- Archivo: `db.sqlite3`

### Producción
- PostgreSQL en Render
- Configurado vía `DATABASE_URL`

## 📦 Dependencias Principales

- Django 5.2.7
- Django REST Framework 3.16.1
- Gunicorn 23.0.0 (servidor WSGI)
- psycopg2-binary 2.9.10 (PostgreSQL)
- django-cors-headers 4.3.1 (CORS)
- django-jazzmin 3.0.0 (Admin UI)
- whitenoise 6.11.0 (archivos estáticos)
- dj-database-url 3.0.1 (configuración DB)

## 🔒 Seguridad

- ✅ SECRET_KEY desde variables de entorno
- ✅ DEBUG=False en producción
- ✅ ALLOWED_HOSTS configurado
- ✅ CORS configurado para frontend específico
- ✅ PostgreSQL con SSL en producción
- ✅ WhiteNoise para archivos estáticos seguros

## 📝 Notas

- El proyecto usa autenticación por token (REST Framework)
- Jazzmin proporciona una interfaz moderna para el admin
- CORS configurado para desarrollo y producción
- Base de datos automática según entorno
