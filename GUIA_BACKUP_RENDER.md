# 📦 Guía de Backup y Persistencia de Datos en Render (SIN TERMINAL)

## ✅ TUS DATOS ESTÁN SEGUROS

### 🔒 Los datos NO se borran con cada despliegue porque:

1. **PostgreSQL es un servicio separado** - La base de datos NO se reconstruye cuando actualizas tu código
2. **Volumen persistente** - Render mantiene los datos en un volumen permanente
3. **Migraciones son inteligentes** - Solo agregan cambios nuevos, no eliminan datos existentes
4. **Scripts seguros** - Configuramos scripts que verifican antes de cargar datos de ejemplo

---

## 📊 CÓMO HACER BACKUP DE LA BASE DE DATOS (Sin Terminal)

### **Opción 1: Usando pgAdmin (Interfaz Gráfica - RECOMENDADO)**

#### **Paso 1: Descargar pgAdmin**
1. Ve a: https://www.pgadmin.org/download/
2. Descarga la versión para Windows
3. Instala pgAdmin4

#### **Paso 2: Obtener credenciales de la base de datos en Render**

1. Ve a **Render.com** → Dashboard
2. Click en tu base de datos **"mopi-database"**
3. **Copia estos datos** (están en la pestaña "Info"):
   ```
   Hostname: oregon-postgres.render.com (ejemplo)
   Port: 5432
   Database: mopi_db
   Username: mopi_user
   Password: ************
   ```

#### **Paso 3: Conectar pgAdmin a tu base de datos**

1. Abre **pgAdmin**
2. Click derecho en **"Servers"** → **"Register"** → **"Server"**

3. **Pestaña General**:
   ```
   Name: MOPI Render Production
   ```

4. **Pestaña Connection**:
   ```
   Host name/address: (pega el Hostname de Render)
   Port: 5432
   Maintenance database: mopi_db
   Username: (pega el Username de Render)
   Password: (pega el Password de Render)
   ☑️ Save password
   ```

5. Click **"Save"**

#### **Paso 4: Hacer Backup desde pgAdmin**

1. En pgAdmin, expande: **Servers** → **MOPI Render Production** → **Databases**
2. Click derecho en **"mopi_db"** → **"Backup..."**

3. **Configuración del backup**:
   ```
   Filename: C:\Backups\mopi_backup_2024_11_17.sql
   Format: Plain (SQL)
   Encoding: UTF8
   ```

4. **Pestaña "Dump Options #1"**:
   ```
   ☑️ Include CREATE DATABASE statement
   ☑️ Include DROP DATABASE statement
   ```

5. Click **"Backup"**

¡Listo! Tienes un archivo SQL con todos tus datos.

#### **Paso 5: Restaurar Backup (cuando lo necesites)**

1. En pgAdmin, click derecho en **"mopi_db"** → **"Restore..."**
2. Selecciona tu archivo de backup: `mopi_backup_2024_11_17.sql`
3. Click **"Restore"**

---

### **Opción 2: Backup Automático de Render (Interfaz Web)**

Render hace backups automáticos, pero solo en planes de pago:

1. Ve a tu base de datos en Render
2. Tab **"Backups"**
3. Aquí aparecen backups automáticos diarios (si tienes plan de pago)

**Plan Gratis**: No tiene backups automáticos, usa pgAdmin como en la Opción 1.

---

### **Opción 3: Exportar datos a Excel/CSV desde Django Admin**

#### **Paso 1: Agregar Django Import-Export**

Ya voy a agregar esto a tu proyecto para que puedas exportar desde la interfaz web.

#### **Paso 2: Exportar desde Django Admin**

1. Ve a: `https://mopi-backend.onrender.com/admin`
2. Login con: `admin` / `mopi2024` (o la contraseña que configuraste)
3. Ve a cualquier modelo (Mesas, Platillos, Órdenes, etc.)
4. Verás botones **"Export"** arriba de la tabla
5. Selecciona formato: **Excel**, **CSV**, o **JSON**
6. Click **"Export"**

¡Descargarás un archivo con todos los datos de esa tabla!

---

## 🔄 CÓMO FUNCIONAN LOS DESPLIEGUES (Sin Perder Datos)

### **Cuando haces Git Push:**

1. ✅ **Se reconstruye el código** (Backend/Frontend)
2. ✅ **Se ejecutan migraciones** (agregan cambios a la BD)
3. ❌ **NO se borra la base de datos**
4. ❌ **NO se borran los datos existentes**
5. ✅ **Solo se cargan datos de ejemplo si la BD está vacía**

### **Script de Seguridad que agregamos:**

```python
# En setup_initial_data.py
if Mesa.objects.exists() or Platillo.objects.exists():
    # ✅ Ya hay datos, NO hacer nada
    return
else:
    # ❌ BD vacía, cargar datos de ejemplo
    populate_all_data()
```

---

## 📅 PROGRAMA DE BACKUPS RECOMENDADO

### **Backup Manual (Gratis)**

**Frecuencia**: Cada semana o antes de cambios importantes

1. Abre **pgAdmin**
2. Click derecho en `mopi_db` → **Backup**
3. Nombra el archivo: `mopi_backup_YYYY_MM_DD.sql`
4. Guarda en carpeta segura (Google Drive, OneDrive, etc.)

### **Backup Automático (Con costo)**

**Opción A**: Actualizar a Render Pro ($7/mes)
- Backups automáticos diarios
- Retención de 7 días

**Opción B**: Usar servicio de terceros
- **BackupNinja**: Backups automáticos desde $5/mes
- **SimpleBackups**: Desde $9/mes con retención de 30 días

---

## 🆘 RECUPERACIÓN DE DESASTRES

### **Si pierdes todos los datos:**

1. **Restaurar desde pgAdmin**:
   - Abre pgAdmin
   - Click derecho en `mopi_db` → **Restore**
   - Selecciona tu archivo de backup más reciente
   - Click **Restore**

2. **Recargar datos de ejemplo**:
   - Ve a Render → **mopi-backend** → **Manual Deploy**
   - Espera a que termine
   - Los datos de ejemplo se cargarán solo si la BD está vacía

---

## ⚙️ CONFIGURACIÓN AUTOMÁTICA EN TU PROYECTO

Ya configuré tu proyecto para:

### ✅ **Inicio Automático Sin Terminal**:

Cuando Render despliega, automáticamente:
1. ✅ Ejecuta migraciones
2. ✅ Crea superusuario `admin` si no existe
3. ✅ Carga datos de ejemplo SOLO si la BD está vacía
4. ✅ Recolecta archivos estáticos
5. ✅ Inicia el servidor

**Credenciales del admin**:
```
Usuario: admin
Email: admin@mopi.com
Password: mopi2024
```

Puedes cambiar la contraseña después de login en:
`https://mopi-backend.onrender.com/admin` → Users → admin → Cambiar contraseña

### ✅ **Variables de Entorno Opcionales en Render**:

Para personalizar las credenciales del admin, agrega en Render:

```env
ADMIN_EMAIL=tu-email@gmail.com
ADMIN_PASSWORD=TuPasswordSegura123
```

---

## 📊 MONITOREAR TUS DATOS

### **Ver datos en tiempo real**:

1. **Django Admin Panel**:
   - URL: `https://mopi-backend.onrender.com/admin`
   - Login: `admin` / `mopi2024`
   - Puedes ver, editar, exportar todos los datos

2. **pgAdmin**:
   - Conectarte a la BD
   - Ver tablas y datos en tiempo real
   - Ejecutar queries SQL

---

## 💾 PLAN DE BACKUP RECOMENDADO (Gratis)

### **Cada Semana**:
1. Abrir pgAdmin
2. Backup de `mopi_db`
3. Subir a Google Drive o OneDrive

### **Antes de cambios importantes**:
1. Backup completo
2. Probar cambios en local primero
3. Desplegar en Render

### **Automatización con Google Drive Backup (Free)**:
- Instalar Google Drive en PC
- Configurar backups de pgAdmin en carpeta sincronizada
- ¡Backup automático a la nube!

---

## ✅ CHECKLIST DE SEGURIDAD

- ✅ Backup semanal con pgAdmin
- ✅ Backups guardados en la nube (Google Drive/OneDrive)
- ✅ Credenciales de admin cambiadas
- ✅ Database URL segura (no compartida públicamente)
- ✅ Datos de prueba solo en primer despliegue

---

## 🎓 RESUMEN RÁPIDO

### **¿Los datos se borran con cada despliegue?**
❌ NO. La base de datos es independiente del código.

### **¿Cómo hago backup sin terminal?**
✅ Usa **pgAdmin** (interfaz gráfica).

### **¿Con qué frecuencia hacer backup?**
✅ Una vez por semana como mínimo.

### **¿Dónde guardo los backups?**
✅ Google Drive, OneDrive, o disco externo.

### **¿Puedo exportar a Excel?**
✅ Sí, desde el Django Admin Panel.

---

**¡Tus datos están seguros! 🎉**
