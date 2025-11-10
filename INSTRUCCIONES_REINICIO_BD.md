# 🔧 Instrucciones para Reiniciar y Poblar la Base de Datos

## Problema Detectado
La base de datos no tiene usuarios creados o no están correctamente configurados, lo que causa errores de comunicación entre frontend y backend.

## Solución: Reiniciar Base de Datos Completa

### Paso 1: Navegar al directorio del backend
```bash
cd "d:\ULSA\MOPI\Backend - MOPI - Restaurante"
```

### Paso 2: Eliminar base de datos existente (SQLite en desarrollo)
```bash
# En Windows PowerShell
Remove-Item db.sqlite3 -ErrorAction SilentlyContinue
```

### Paso 3: Recrear la base de datos
```bash
python manage.py makemigrations
python manage.py migrate
```

### Paso 4: Crear usuarios del sistema
```bash
python manage.py populate_users
```

**Salida esperada:**
```
🚀 Creando usuarios de ejemplo...
👤 Creando usuario principal...
✅ Admin creado: Restaurante (PIN: 0000)
👨‍🍳 Creando usuarios de cocina...
✅ Cocinero creado: Carlos Rodríguez (PIN: 1234)
✅ Cocinero creado: Ana García (PIN: 5678)
🍽️ Creando usuarios meseros...
✅ Mesero creado: Juan Pérez (PIN: 1111)
✅ Mesero creado: María López (PIN: 2222)
✅ Mesero creado: Luis Martínez (PIN: 3333)
✅ Mesero creado: Sofía Hernández (PIN: 4444)
💰 Creando usuario cajero...
✅ Cajero creado: Roberto Sánchez (PIN: 9999)
```

### Paso 5: Poblar datos de ejemplo (menú, inventario, mesas, etc.)
```bash
python manage.py populate_all_data
```

### Paso 6: Iniciar el servidor backend
```bash
python manage.py runserver
```

El servidor debería estar corriendo en: `http://localhost:8000`

## Verificar que funciona

### 1. Verificar endpoint de personal (debe retornar usuarios)
Abrir en navegador o Postman:
```
http://localhost:8000/api/administrador/personal/
```

**Nota:** Puede pedirte login. Usa:
- Usuario: `Restaurante`
- Password: `Contraseña123`

### 2. Verificar endpoint de menú
```
http://localhost:8000/api/administrador/menu-completo/
```

Debe retornar las 7 categorías con platos.

### 3. Login en el frontend
```
Usuario: Restaurante
Password: Contraseña123
```

Luego selecciona rol y usa el PIN correspondiente:
- **Admin**: 0000
- **Cocina**: 1234 o 5678
- **Meseros**: 1111, 2222, 3333, 4444
- **Cajero**: 9999

## Cambios Realizados en el Backend

### 1. ✅ Comando `populate_users.py` creado
- Crea todos los usuarios necesarios con roles y PINs correctos
- Debe ejecutarse ANTES de `populate_all_data`

### 2. ✅ REST_FRAMEWORK settings corregido
- Separados correctamente `DEFAULT_AUTHENTICATION_CLASSES` de `DEFAULT_RENDERER_CLASSES`
- Ahora el token de autenticación funciona correctamente

### 3. ✅ GestionPersonalViewSet actualizado
- Cambiado de `IsAdminUser` a `IsAuthenticated`
- Usuarios autenticados pueden ver la lista de personal
- Solo admin puede crear/editar/eliminar

### 4. ✅ UserSerializer mejorado
- Soporta creación de usuarios con password hasheado
- Incluye campo `full_name` calculado
- Maneja correctamente actualizaciones

## Errores Comunes y Soluciones

### Error: "No module named 'django'"
**Solución:** Activa el entorno virtual
```bash
# Windows
.\venv\Scripts\Activate.ps1

# Si no existe venv, créalo:
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Error: "Error obteniendo personal"
**Solución:** 
1. Verifica que el backend esté corriendo en `http://localhost:8000`
2. Ejecuta los comandos populate en orden
3. Verifica que hayas hecho login con `Restaurante` / `Contraseña123`

### Error: "CORS policy"
**Solución:** El backend ya está configurado para aceptar `localhost:5173`
Verifica que el frontend esté corriendo en ese puerto.

### Error: "Token inválido" o "No autorizado"
**Solución:** 
1. Cierra sesión en el frontend
2. Vuelve a hacer login
3. El sistema generará un nuevo token

## Variables de Entorno

### Frontend (.env en la carpeta Frontend)
```env
VITE_API_URL=http://localhost:8000
```

### Backend (.env en la carpeta Backend)
```env
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Orden de Ejecución Completo

1. ✅ `python manage.py makemigrations`
2. ✅ `python manage.py migrate`
3. ✅ `python manage.py populate_users` ← **NUEVO**
4. ✅ `python manage.py populate_all_data`
5. ✅ `python manage.py runserver`
6. ✅ En otra terminal: `cd Frontend && npm run dev`
7. ✅ Abrir `http://localhost:5173`
8. ✅ Login: `Restaurante` / `Contraseña123`
9. ✅ Seleccionar rol y usar PIN

## Contacto de Soporte

Si después de seguir todos estos pasos aún hay errores:
1. Revisa los logs del backend (donde ejecutaste `runserver`)
2. Revisa la consola del navegador (F12)
3. Verifica que ambos servicios estén corriendo
