# 📋 Resumen de Correcciones Realizadas

## 🔍 Problemas Detectados

1. **❌ No existían usuarios en la base de datos**
   - El comando `populate_all_data` buscaba usuarios que no existían
   - No había forma de crear usuarios iniciales

2. **❌ Configuración incorrecta de REST_FRAMEWORK**
   - `DEFAULT_AUTHENTICATION_CLASSES` estaba en `DEFAULT_RENDERER_CLASSES`
   - La autenticación por token no funcionaba correctamente

3. **❌ Permisos muy restrictivos en GestionPersonalViewSet**
   - Solo usuarios `IsAdminUser` podían ver la lista de personal
   - Esto bloqueaba el acceso incluso con usuario autenticado

4. **❌ Token no se enviaba en las peticiones del frontend**
   - El header `Authorization` no se incluía automáticamente
   - Todas las peticiones después del login fallaban por falta de autenticación

5. **❌ UserSerializer no manejaba creación correctamente**
   - No hasheaba passwords al crear usuarios
   - Faltaba lógica para crear con `create_user`

---

## ✅ Soluciones Implementadas

### 1. **Comando `populate_users.py` Creado**

**Ubicación:** `Backend - MOPI - Restaurante/administrador/management/commands/populate_users.py`

**Función:** Crea todos los usuarios necesarios para el sistema:
- ✅ 1 Administrador (PIN: 0000)
- ✅ 2 Cocineros (PIN: 1234, 5678)
- ✅ 4 Meseros (PIN: 1111, 2222, 3333, 4444)
- ✅ 1 Cajero (PIN: 9999)

**Uso:**
```bash
python manage.py populate_users
```

---

### 2. **REST_FRAMEWORK Settings Corregido**

**Archivo:** `drfsimplecrud/settings.py`

**Antes:**
```python
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
        "rest_framework.authentication.TokenAuthentication",  # ❌ INCORRECTO
        "rest_framework.authentication.SessionAuthentication",  # ❌ INCORRECTO
    ),
}
```

**Después:**
```python
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ),
    "DEFAULT_AUTHENTICATION_CLASSES": (  # ✅ CORRECTO
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
}
```

---

### 3. **GestionPersonalViewSet Mejorado**

**Archivo:** `administrador/views.py`

**Cambios:**
- ✅ Permisos cambiados de `IsAdminUser` a `IsAuthenticated`
- ✅ Control granular: solo admin puede crear/editar/eliminar
- ✅ Usuarios autenticados pueden ver la lista
- ✅ Filtrado por rol implementado en `get_queryset()`

**Código:**
```python
class GestionPersonalViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]  # ✅ Cambiado
    
    def get_queryset(self):
        if self.request.user.role == 'admin':
            return User.objects.all()
        else:
            return User.objects.filter(is_active=True)
    
    def create(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'error': 'Solo administradores'}, status=403)
        return super().create(request, *args, **kwargs)
```

---

### 4. **Token Agregado a Headers del Frontend**

**Archivo:** `Frontend/src/config/api.js`

**Antes:**
```javascript
export const getDefaultHeaders = () => ({
  Accept: "application/json",
  "Content-Type": "application/json",
});  // ❌ Sin token
```

**Después:**
```javascript
export const getDefaultHeaders = () => {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  
  // ✅ Agregar token de autenticación si existe
  const token = localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Token ${token}`;
  }
  
  return headers;
};
```

---

### 5. **UserSerializer con Creación Correcta**

**Archivo:** `users/serializers.py`

**Agregado:**
- ✅ Campo `password` write_only
- ✅ Método `create()` que usa `create_user()` para hashear
- ✅ Método `update()` que maneja cambios de password
- ✅ Campo calculado `full_name`

**Código:**
```python
def create(self, validated_data):
    password = validated_data.pop('password', 'password123')
    usuario = validated_data.get('username', '')
    
    # ✅ Crear usuario con create_user para hashear la contraseña
    user = User.objects.create_user(
        username=validated_data.get('username'),
        email=validated_data.get('email', f"{usuario}@restaurant.com"),
        password=password,
        usuario=usuario,
        first_name=validated_data.get('first_name', ''),
        last_name=validated_data.get('last_name', ''),
        role=validated_data.get('role', 'waiter'),
        pin=validated_data.get('pin', '0000'),
        color=validated_data.get('color', '#3b82f6'),
    )
    return user
```

---

## 🚀 Pasos para Aplicar las Correcciones

### 1. Reiniciar Base de Datos
```bash
cd "d:\ULSA\MOPI\Backend - MOPI - Restaurante"

# Eliminar BD antigua
Remove-Item db.sqlite3 -ErrorAction SilentlyContinue

# Recrear BD
python manage.py makemigrations
python manage.py migrate
```

### 2. Crear Usuarios
```bash
python manage.py populate_users
```

### 3. Poblar Datos
```bash
python manage.py populate_all_data
```

### 4. Iniciar Backend
```bash
python manage.py runserver
```

### 5. Iniciar Frontend
```bash
cd "d:\ULSA\MOPI\Restaurant-DonPepe-main\RestaurantSoft-main\Frontend"
npm run dev
```

### 6. Probar Login
- URL: `http://localhost:5173`
- Usuario: `Restaurante`
- Password: `Contraseña123`
- PIN Admin: `0000`

---

## 🧪 Verificación de Funcionamiento

### Endpoint de Personal
```bash
# Debe retornar lista de usuarios
curl -H "Authorization: Token <tu-token>" http://localhost:8000/api/administrador/personal/
```

### Endpoint de Menú
```bash
# Debe retornar 7 categorías con platos
curl -H "Authorization: Token <tu-token>" http://localhost:8000/api/administrador/menu-completo/
```

### Frontend - Vista de Personal
1. Login como Admin
2. Ir a "Personal"
3. Debe mostrar 7 empleados (Carlos, Ana, Juan, María, Luis, Sofía, Roberto)

---

## 📊 Flujo de Autenticación Corregido

```
1. Usuario hace login → POST /api/users/login/
   ↓
2. Backend valida credenciales
   ↓
3. Backend retorna: { token: "abc123", user: {...} }
   ↓
4. Frontend guarda token en localStorage
   ↓
5. Frontend agrega header en TODAS las peticiones:
   Authorization: Token abc123
   ↓
6. Backend valida token con TokenAuthentication
   ↓
7. Backend permite acceso según permisos del usuario
```

---

## 🎯 Endpoints Actualizados

| Endpoint | Permiso | Descripción |
|----------|---------|-------------|
| `/api/users/login/` | AllowAny | Login inicial |
| `/api/users/verify-pin/` | AllowAny | Verificar PIN |
| `/api/administrador/personal/` | IsAuthenticated | Lista de usuarios |
| `/api/administrador/personal/` POST | IsAdmin | Crear usuario |
| `/api/administrador/personal/{id}/` PUT | IsAdmin | Editar usuario |
| `/api/administrador/personal/{id}/` DELETE | IsAdmin | Eliminar usuario |
| `/api/administrador/menu-completo/` | IsAuthenticated | Menú completo |
| `/api/administrador/dashboard/` | IsAdminUser | Dashboard |

---

## ✅ Checklist de Verificación

- [ ] Base de datos recreada con `migrate`
- [ ] Comando `populate_users` ejecutado exitosamente
- [ ] Comando `populate_all_data` ejecutado exitosamente
- [ ] Backend corriendo en `http://localhost:8000`
- [ ] Frontend corriendo en `http://localhost:5173`
- [ ] Login funciona con `Restaurante` / `Contraseña123`
- [ ] Vista de Personal muestra 7 empleados
- [ ] Menú carga correctamente en panel de mesero
- [ ] No hay errores CORS en consola del navegador
- [ ] No hay errores 401/403 en peticiones API

---

## 🐛 Troubleshooting

### Error: "Error obteniendo personal"
✅ **Solución:** Verifica que el token esté en localStorage y que el header `Authorization` se envíe.

### Error: "CORS policy"
✅ **Solución:** Verifica `CORS_ALLOWED_ORIGINS` en settings.py incluye `http://localhost:5173`

### Error: "No module named 'django'"
✅ **Solución:** Activa el entorno virtual: `.\venv\Scripts\Activate.ps1`

### Menú no carga
✅ **Solución:** Ejecuta `populate_all_data` para crear categorías y platos

### Personal aparece vacío
✅ **Solución:** Ejecuta `populate_users` ANTES de `populate_all_data`

---

## 📝 Archivos Modificados

### Backend
1. ✅ `drfsimplecrud/settings.py` - REST_FRAMEWORK corregido
2. ✅ `administrador/views.py` - GestionPersonalViewSet mejorado
3. ✅ `users/serializers.py` - UserSerializer con create/update
4. ✅ `administrador/management/commands/populate_users.py` - NUEVO

### Frontend
1. ✅ `src/config/api.js` - Token agregado a headers
2. ✅ `src/services/adminStaffService.js` - Alias getStaff agregado

---

## 🎉 Resultado Esperado

Después de aplicar todas las correcciones:

✅ Login funciona correctamente
✅ Token se guarda y envía automáticamente
✅ Vista de Personal carga 7 empleados
✅ Menú se carga en panel de mesero
✅ Dashboard muestra métricas correctamente
✅ Todas las vistas sincronizan datos del backend
✅ No hay errores en consola del navegador
✅ No hay errores 401/403 en peticiones API
