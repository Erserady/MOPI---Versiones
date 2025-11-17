# 🔐 CREDENCIALES DE USUARIOS - RENDER

## 🎯 USUARIOS DEL SISTEMA

### **👨‍💼 SUPERUSUARIOS (ADMIN)**

#### **1. Usuario: `admin`**
```
Username: admin
Password: mopi2024
Role: SUPERUSER
```
**Creado por:** `entrypoint.sh` (si no existe)
**Acceso:**
- ✅ Django Admin: https://mopi-backend-aa6a.onrender.com/admin/
- ✅ Frontend: https://mopi-frontend.onrender.com

---

#### **2. Usuario: `Restaurante`**
```
Username: Restaurante
Password: Contraseña123
Role: ADMIN (superuser)
```
**Creado por:** `production_data.json`
**Acceso:**
- ✅ Django Admin: https://mopi-backend-aa6a.onrender.com/admin/
- ✅ Frontend: https://mopi-frontend.onrender.com

---

#### **3. Usuario: `administrador`**
```
Username: administrador
Password: admin123
PIN: 0000
Role: ADMIN
```
**Creado por:** `production_data.json`
**Acceso:**
- ✅ Frontend: https://mopi-frontend.onrender.com
- ✅ Django Admin (sin permisos de staff)

---

## 👨‍🍳 COCINEROS

#### **4. Usuario: `carlos.mendez`**
```
Username: carlos.mendez
Password: carlos123
PIN: 1234
Role: COOK
Nombre: Carlos Méndez
```

#### **5. Usuario: `ana.torres`**
```
Username: ana.torres
Password: ana123
PIN: 5678
Role: COOK
Nombre: Ana Torres
```

---

## 🍽️ MESEROS

#### **6. Usuario: `juan.perez`**
```
Username: juan.perez
Password: juan123
PIN: 1111
Role: WAITER
Nombre: Juan Pérez
```

#### **7. Usuario: `maria.garcia`**
```
Username: maria.garcia
Password: maria123
PIN: 2222
Role: WAITER
Nombre: María García
```

#### **8. Usuario: `luis.ramirez`**
```
Username: luis.ramirez
Password: luis123
PIN: 3333
Role: WAITER
Nombre: Luis Ramírez
```

#### **9. Usuario: `sofia.lopez`**
```
Username: sofia.lopez
Password: sofia123
PIN: 4444
Role: WAITER
Nombre: Sofía López
```

---

## 💰 CAJEROS

#### **10. Usuario: `roberto.diaz`**
```
Username: roberto.diaz
Password: roberto123
PIN: 9999
Role: CASHIER
Nombre: Roberto Díaz
```

---

## 🔑 RESUMEN DE ACCESO

### **Para Django Admin (Backend):**
```
URL: https://mopi-backend-aa6a.onrender.com/admin/

Usuarios con acceso:
✅ admin / mopi2024 (SUPERUSER)
✅ Restaurante / Contraseña123 (SUPERUSER)
```

### **Para Frontend (Aplicación Web):**
```
URL: https://mopi-frontend.onrender.com

TODOS los usuarios pueden acceder con:
- Username + Password
- O con su PIN (si está configurado)
```

---

## 📝 FORMATO DE LOGIN EN FRONTEND

### **Opción 1: Username + Password**
```json
{
  "username": "carlos.mendez",
  "password": "carlos123"
}
```

### **Opción 2: User ID + PIN**
```json
{
  "user_id": 2,
  "pin": "1234"
}
```

---

## ⚠️ IMPORTANTE

1. **Las contraseñas se configuran automáticamente** al cargar `production_data.json`
2. **El usuario `admin`** se crea si no existe al iniciar el contenedor
3. **Cambia las contraseñas** después del primer login por seguridad
4. **Los PINs** son para acceso rápido desde el frontend
5. **Todos los usuarios** están activos (`is_active=true`)

---

## 🔄 CAMBIAR CONTRASEÑAS

### **Desde Django Admin:**
1. Login con `admin` / `mopi2024`
2. Ve a **Users**
3. Click en el usuario
4. Scroll hasta **Password**
5. Click en **"this form"** para cambiarla
6. Ingresa la nueva contraseña dos veces
7. Click **Save**

### **Programáticamente (opcional):**
```python
from users.models import User

user = User.objects.get(username='carlos.mendez')
user.set_password('nueva_contraseña_segura')
user.save()
```

---

## 🎯 TESTING RÁPIDO

### **Test 1: Django Admin**
```
URL: https://mopi-backend-aa6a.onrender.com/admin/
User: admin
Pass: mopi2024
Resultado esperado: ✅ Acceso al panel de administración
```

### **Test 2: API Login (Postman/Curl)**
```bash
POST https://mopi-backend-aa6a.onrender.com/api/users/login/
Content-Type: application/json

{
  "username": "Restaurante",
  "password": "Contraseña123"
}

Resultado esperado:
{
  "token": "abc123...",
  "user": { "id": 1, "username": "Restaurante", ... },
  "groups": []
}
```

### **Test 3: Frontend**
```
URL: https://mopi-frontend.onrender.com
User: juan.perez
Pass: juan123
Resultado esperado: ✅ Acceso al panel de mesero
```

---

## 📊 ROLES Y PERMISOS

| Usuario | Role | Superuser | Staff | Admin Panel | Frontend |
|---------|------|-----------|-------|-------------|----------|
| admin | - | ✅ | ✅ | ✅ Full | ✅ |
| Restaurante | admin | ✅ | ✅ | ✅ Full | ✅ |
| administrador | admin | ❌ | ❌ | ❌ No | ✅ |
| carlos.mendez | cook | ❌ | ❌ | ❌ No | ✅ Cocina |
| ana.torres | cook | ❌ | ❌ | ❌ No | ✅ Cocina |
| juan.perez | waiter | ❌ | ❌ | ❌ No | ✅ Mesero |
| maria.garcia | waiter | ❌ | ❌ | ❌ No | ✅ Mesero |
| luis.ramirez | waiter | ❌ | ❌ | ❌ No | ✅ Mesero |
| sofia.lopez | waiter | ❌ | ❌ | ❌ No | ✅ Mesero |
| roberto.diaz | cashier | ❌ | ❌ | ❌ No | ✅ Caja |

---

**Última actualización:** 2025-11-17
**Generado automáticamente por:** `load_production_data.py`
