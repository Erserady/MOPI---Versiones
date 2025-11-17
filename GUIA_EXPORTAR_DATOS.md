# 📦 GUÍA: EXPORTAR DATOS LOCALES Y CARGARLOS EN RENDER

## 🎯 OBJETIVO

Exportar tu menú, usuarios y mesas de la base de datos local y cargarlos automáticamente en Render al hacer deploy.

---

## ✅ PASO 1: EXPORTAR DATOS LOCALES

### **1.1 Activar entorno virtual (Windows)**

```powershell
cd "d:\ULSA\MOPI\Backend - MOPI - Restaurante"
.\venv\Scripts\activate
```

Si no tienes entorno virtual:
```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements_updated.txt
```

### **1.2 Exportar datos**

```powershell
python manage.py export_production_data
```

**Esto creará el archivo:** `production_data.json`

**Contendrá:**
- ✅ Todas las categorías del menú
- ✅ Todos los platos
- ✅ Todas las mesas
- ✅ Todos los usuarios (incluyendo admin)

---

## ✅ PASO 2: REVISAR LOS DATOS EXPORTADOS

Abre el archivo `production_data.json` y verifica:

1. **Usuarios:**
   - Contraseñas están hasheadas (seguras) ✅
   - Incluye tu usuario admin
   - Incluye meseros, cocineros, cajeros

2. **Menú:**
   - Todas las categorías están presentes
   - Todos los platos con precios correctos
   - Ingredientes y tiempos de preparación

3. **Mesas:**
   - Todas las mesas de tu restaurante
   - Números correctos

⚠️ **IMPORTANTE:** 
- Las contraseñas se exportan hasheadas (seguras)
- No edites manualmente las contraseñas en el JSON
- Si necesitas cambiar una contraseña, hazlo después desde el admin

---

## ✅ PASO 3: SUBIR DATOS A GIT

```powershell
git add production_data.json
git add "Backend - MOPI - Restaurante/administrador/management/commands/export_production_data.py"
git add "Backend - MOPI - Restaurante/administrador/management/commands/load_production_data.py"
git add "Backend - MOPI - Restaurante/docker/entrypoint.sh"
git commit -m "Add: Sistema de exportación e importación de datos de producción"
git push origin main
```

---

## ✅ PASO 4: DEPLOY AUTOMÁTICO EN RENDER

Render detectará los cambios y:

1. ✅ **Ejecutará migraciones**
2. ✅ **Creará superusuario** (si no existe)
3. ✅ **Buscará** `production_data.json`
4. ✅ **Cargará tus datos** automáticamente
5. ✅ **Iniciará el servidor**

### **Logs esperados en Render:**

```
[init] Cargando datos de producción...
🔍 Verificando si hay datos en la base de datos...
📦 Cargando datos desde production_data.json...
Installed 150 object(s) from 1 fixture(s)

✅ Datos de producción cargados correctamente

📊 Datos cargados:
   📁 Categorías: 8
   🍽️  Platos: 95
   🪑 Mesas: 15
   👥 Usuarios: 6
```

---

## 🔄 ACTUALIZAR DATOS EN EL FUTURO

Si agregas más platos o usuarios en local:

1. **Exporta de nuevo:**
   ```powershell
   python manage.py export_production_data
   ```

2. **Sube a Git:**
   ```powershell
   git add production_data.json
   git commit -m "Update: Actualizar datos de producción"
   git push origin main
   ```

3. **Render redesplegará automáticamente**

⚠️ **NOTA:** El comando `load_production_data` solo carga datos si la base de datos está **VACÍA**. Si ya tienes datos en Render, no los sobrescribirá.

---

## 🗑️ REINICIAR BASE DE DATOS EN RENDER

Si quieres borrar TODO y cargar datos frescos:

1. Ve a **Render.com** → **mopi-database**
2. Click en **"Settings"**
3. Scroll hasta **"Danger Zone"**
4. Click en **"Delete Database"**
5. **Confirma**
6. **Crea nueva base de datos** con el mismo nombre
7. **Actualiza** la variable `DATABASE_URL` en el backend
8. Render redesplegará y cargará `production_data.json` automáticamente

---

## 🧪 PROBAR LOCALMENTE

Si quieres probar que el archivo funciona:

```powershell
# Borrar base de datos local (opcional)
rm db.sqlite3

# Ejecutar migraciones
python manage.py migrate

# Cargar datos
python manage.py load_production_data
```

---

## ❓ PREGUNTAS FRECUENTES

### **¿Puedo editar production_data.json manualmente?**

Sí, pero con cuidado:
- ✅ Puedes cambiar precios, nombres, ingredientes
- ✅ Puedes agregar o eliminar platos
- ❌ NO edites las contraseñas hasheadas
- ❌ NO cambies los `pk` (primary keys) sin saber qué haces

### **¿Se borrarán mis datos cada vez que haga deploy?**

❌ **NO.** El comando solo carga datos si la base de datos está **completamente vacía**.

### **¿Cómo agrego un usuario nuevo directamente en Render?**

1. Ve al Django Admin: `https://mopi-backend-aa6a.onrender.com/admin/`
2. Login con `admin` / `mopi2024`
3. Crea el usuario manualmente
4. Si quieres que persista en futuros deploys:
   - Exporta de nuevo desde local
   - Sube a Git

### **¿Qué pasa si production_data.json no existe?**

El sistema cargará `populate_all_data` como respaldo (datos de ejemplo).

---

## ✅ RESUMEN RÁPIDO

```powershell
# 1. Exportar datos locales
python manage.py export_production_data

# 2. Subir a Git
git add production_data.json
git commit -m "Add: Datos de producción"
git push origin main

# 3. Esperar deploy de Render (5 minutos)

# 4. Verificar en admin
# https://mopi-backend-aa6a.onrender.com/admin/
```

---

**¡Listo!** Tu menú, usuarios y mesas estarán automáticamente en Render. 🎉
