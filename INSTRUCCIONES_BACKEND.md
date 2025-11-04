# Instrucciones para Correr el Backend y Frontend

## Backend (Django REST Framework)

### 1. Navegar al directorio del backend
```bash
cd "D:\ULSA\MOPI\Backend - MOPI - Restaurante"
```

### 2. Activar el entorno virtual
Si ya existe un entorno virtual (carpeta `venv`):
```bash
.\venv\Scripts\activate
```

Si NO existe, créalo primero:
```bash
python -m venv venv
.\venv\Scripts\activate
```

### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 4. Aplicar migraciones (actualizar base de datos)
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Crear superusuario para acceder al panel de administración (OPCIONAL)
Si quieres acceder al panel de administración de Django para gestionar usuarios:
```bash
python manage.py createsuperuser
```
Te pedirá:
- Username (puedes usar: `admin`)
- Email (ejemplo: `admin@donpepe.com`)
- Password (elige una segura, ejemplo: `admin123`)

### 6. Poblar la base de datos con usuarios de prueba
```bash
python manage.py populate_users
```

Esto creará:

#### **Usuario para Login Inicial**
- **Usuario**: `Restaurante`
- **Contraseña**: `Contraseña123`

#### **Usuarios por Rol (solo usan PIN)**

**Cocina (2 usuarios)**
- Carlos Méndez - PIN: `1234`
- Ana Torres - PIN: `5678`

**Meseros (4 usuarios)**
- Juan Pérez - PIN: `1111`
- María García - PIN: `2222`
- Luis Ramírez - PIN: `3333`
- Sofía López - PIN: `4444`

**Caja (1 usuario)**
- Roberto Díaz - PIN: `9999`

**Administrador (1 usuario)**
- Administrador - PIN: `0000`

### 7. Correr el servidor de desarrollo
```bash
python manage.py runserver
```

El servidor estará disponible en: **http://localhost:8000**

### 8. Acceder al Panel de Administración de Django

Para gestionar usuarios (cambiar roles, PINs, crear/editar/eliminar usuarios):

1. Asegúrate de haber creado un superusuario (paso 5)
2. Con el servidor corriendo, ve a: **http://localhost:8000/admin/**
3. Ingresa con las credenciales del superusuario
4. Haz clic en "Users" para ver todos los usuarios

#### **¿Qué puedes hacer en el admin?**
- ✅ **Ver lista de usuarios** con su rol, PIN y estado
- ✅ **Editar usuarios** directamente desde la lista (PIN y rol)
- ✅ **Ver/editar detalles** de cada usuario (click en el username)
- ✅ **Crear nuevos usuarios** con el botón "Add User"
- ✅ **Cambiar roles** (cook, waiter, cashier, admin)
- ✅ **Modificar PINs** de cualquier usuario
- ✅ **Cambiar colores** de avatar
- ✅ **Activar/desactivar** usuarios
- ✅ **Resetear PINs** en lote (selecciona usuarios → Actions → Reset PIN)
- ✅ **Buscar y filtrar** por nombre, email, rol

### 9. Endpoints API disponibles

#### **Autenticación**
- `POST /api/users/login/` - Login con username/password
- `POST /api/users/register/` - Registro de nuevos usuarios

#### **Gestión de Usuarios**
- `GET /api/users/by-role/?role=cook` - Obtener usuarios por rol (cook, waiter, cashier, admin)
- `POST /api/users/verify-pin/` - Verificar PIN de usuario

---

## Frontend (React + Vite)

### 1. Navegar al directorio del frontend
```bash
cd "D:\ULSA\MOPI\Restaurant-DonPepe-main\RestaurantSoft-main\Frontend"
```

### 2. Instalar dependencias (si es la primera vez)
```bash
npm install
```

### 3. Correr el servidor de desarrollo
```bash
npm run dev
```

El frontend estará disponible en: **http://localhost:5173**

---

## Flujo de Autenticación

### 1. Login Principal
1. Abre el navegador en `http://localhost:5173`
2. Ingresa las credenciales del sistema:
   - **Usuario**: `Restaurante`
   - **Contraseña**: `Contraseña123`
3. Después del login exitoso, se redirige a `/admin-preview`

### 2. Selección de Usuario por Rol (Admin Preview)
1. Selecciona un área (Cocina, Meseros, Caja, Administrador)
2. Se muestra un modal con los usuarios disponibles para ese rol
3. Selecciona un usuario específico
4. Ingresa el PIN del usuario seleccionado
5. Si el PIN es correcto, se accede al dashboard correspondiente con la sesión del usuario

---

## Troubleshooting

### Backend no inicia
- Verifica que el entorno virtual esté activado
- Verifica que todas las dependencias estén instaladas: `pip install -r requirements.txt`
- Verifica que las migraciones estén aplicadas: `python manage.py migrate`

### Frontend no conecta con el backend
- Verifica que el backend esté corriendo en `http://localhost:8000`
- Verifica la configuración CORS en `settings.py` (debe incluir `http://localhost:5173`)
- Abre la consola del navegador (F12) para ver errores

### Error de CORS
Si ves errores de CORS en la consola:
1. Verifica que `corsheaders` esté instalado: `pip install django-cors-headers`
2. Verifica que en `settings.py` esté configurado:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

### Base de datos vacía
Si no hay usuarios, ejecuta:
```bash
python manage.py populate_users
```

---

## Estructura del Proyecto

```
MOPI/
├── Backend - MOPI - Restaurante/
│   ├── users/                    # App de usuarios
│   │   ├── models.py            # Modelo User con rol y PIN
│   │   ├── views.py             # Vistas de autenticación
│   │   ├── serializers.py       # Serializers de DRF
│   │   └── management/commands/ # Comando para poblar DB
│   ├── manage.py
│   └── db.sqlite3              # Base de datos SQLite
│
└── Restaurant-DonPepe-main/RestaurantSoft-main/Frontend/
    ├── src/
    │   ├── components/          # UserSelectionModal
    │   ├── views/               # Login, Dashboards
    │   └── styles/
    └── package.json
```

---

## Notas Importantes

1. **Seguridad**: En producción, los PINes deberían estar hasheados, no en texto plano
2. **Tokens**: Los tokens JWT se guardan en localStorage
3. **CORS**: Solo configurado para desarrollo local
4. **Base de datos**: SQLite es solo para desarrollo, usar PostgreSQL en producción

---

## Gestión de Usuarios

### Opción 1: Panel de Administración de Django (Recomendado) 🎨

**Acceso**: http://localhost:8000/admin/

**Ventajas:**
- Interfaz gráfica intuitiva
- Edición rápida directa en la lista
- Búsqueda y filtros avanzados
- Acciones en lote (resetear PINs, activar/desactivar usuarios)
- No necesitas conocimientos técnicos

**Cómo usar:**
1. Ve a http://localhost:8000/admin/
2. Login con tu superusuario
3. Click en "Users"
4. Para **editar un usuario**: Click en el username
5. Para **cambiar PIN/Rol rápido**: Edita directamente en la lista y guarda
6. Para **crear usuario**: Click en "Add User" arriba a la derecha
7. Para **acciones en lote**: Selecciona usuarios → dropdown "Actions"

### Opción 2: Django Shell (Para usuarios avanzados) 💻

#### Ver todos los usuarios
```bash
python manage.py shell
```
```python
from users.models import User
users = User.objects.all()
for u in users:
    print(f"{u.username} - {u.get_role_display()} - PIN: {u.pin}")
```

#### Cambiar PIN de un usuario
```python
from users.models import User
user = User.objects.get(username='juan.perez')
user.pin = '9999'
user.save()
print(f"PIN de {user.username} cambiado a {user.pin}")
```

#### Cambiar rol de un usuario
```python
from users.models import User
user = User.objects.get(username='carlos.mendez')
user.role = 'admin'  # Opciones: 'cook', 'waiter', 'cashier', 'admin'
user.save()
print(f"Rol de {user.username} cambiado a {user.get_role_display()}")
```

#### Crear un nuevo usuario
```python
from users.models import User
nuevo_usuario = User.objects.create_user(
    username='pedro.garcia',
    email='pedro@donpepe.com',
    password='temp_password',
    first_name='Pedro',
    last_name='García',
    usuario='pedro.garcia',
    role='waiter',
    pin='7777',
    color='#e67e22'
)
print(f"Usuario {nuevo_usuario.username} creado exitosamente")
```

### Opción 3: Comando populate_users

Para resetear todos los usuarios a los valores por defecto:
```bash
python manage.py populate_users
```
Esto actualiza usuarios existentes y crea los que faltan.

## Comandos Rápidos

### Resetear base de datos completamente
```bash
cd "D:\ULSA\MOPI\Backend - MOPI - Restaurante"
.\venv\Scripts\activate
python manage.py flush --noinput
python manage.py migrate
python manage.py createsuperuser  # Si quieres acceso al admin
python manage.py populate_users
```
