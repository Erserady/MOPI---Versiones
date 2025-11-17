# 🌐 Guía de Acceso desde la Red Local

Esta guía te ayudará a configurar Docker para que otros dispositivos en tu red puedan acceder a la aplicación.

---

## 📋 Pasos para Configurar Acceso en Red Local

### 1. Encontrar tu IP Local

Abre PowerShell o CMD y ejecuta:

```powershell
ipconfig
```

Busca tu **Dirección IPv4** en la sección de tu adaptador de red activo (WiFi o Ethernet).  
Ejemplo: `192.168.1.100`

**Guárdala**, la necesitarás en el siguiente paso.

---

### 2. Modificar docker-compose.yml

Edita el archivo `docker-compose.yml` y cambia la línea 55:

**ANTES:**
```yaml
VITE_API_URL: http://localhost:8000
```

**DESPUÉS (usa TU IP local):**
```yaml
VITE_API_URL: http://192.168.1.100:8000
```

⚠️ **Reemplaza `192.168.1.100` con la IP que encontraste en el paso 1.**

---

### 3. Reconstruir el Frontend

Después de modificar `docker-compose.yml`, reconstruye el contenedor del frontend:

```powershell
docker compose down
docker compose up --build -d
```

Esto es necesario porque el `VITE_API_URL` se configura en tiempo de compilación.

---

### 4. Configurar el Firewall de Windows

Windows bloquea conexiones entrantes por defecto. Necesitas abrir los puertos:

#### Opción A: Usar PowerShell (Recomendado)

Abre PowerShell **como Administrador** y ejecuta:

```powershell
# Permitir puerto 5173 (Frontend)
New-NetFirewallRule -DisplayName "MOPI Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow

# Permitir puerto 8000 (Backend)
New-NetFirewallRule -DisplayName "MOPI Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

#### Opción B: Usar la Interfaz Gráfica

1. Abre **Windows Defender Firewall** → **Configuración avanzada**
2. Click en **Reglas de entrada** → **Nueva regla**
3. Selecciona **Puerto** → Siguiente
4. Selecciona **TCP** y escribe `5173` → Siguiente
5. Selecciona **Permitir la conexión** → Siguiente
6. Marca todas las opciones (Dominio, Privado, Público) → Siguiente
7. Ponle un nombre: "MOPI Frontend" → Finalizar
8. **Repite los pasos para el puerto `8000`** (Backend)

---

### 5. Verificar que Docker esté Escuchando en Todas las Interfaces

Verifica que los contenedores estén corriendo:

```powershell
docker compose ps
```

Verifica que los puertos estén abiertos en todas las interfaces:

```powershell
netstat -ano | findstr :5173
netstat -ano | findstr :8000
```

Deberías ver líneas como:
```
TCP    0.0.0.0:5173           0.0.0.0:0              LISTENING
TCP    0.0.0.0:8000           0.0.0.0:0              LISTENING
```

Si ves `127.0.0.1` en lugar de `0.0.0.0`, significa que el servicio solo escucha en localhost.

---

### 6. Acceder desde Otros Dispositivos

Desde cualquier dispositivo en la misma red:

- **Frontend**: `http://192.168.1.100:5173` (usa tu IP)
- **Backend API**: `http://192.168.1.100:8000` (usa tu IP)

---

## 🔧 Solución de Problemas

### ❌ Error: "No se puede acceder desde otro dispositivo"

**Verificaciones:**

1. **¿Tu PC y el otro dispositivo están en la misma red?**
   - Ambos deben estar conectados a la misma WiFi o router

2. **¿Modificaste el `VITE_API_URL` con tu IP?**
   ```powershell
   docker compose exec frontend cat /usr/share/nginx/html/assets/index*.js | findstr VITE_API_URL
   ```

3. **¿Reconstruiste el frontend después del cambio?**
   ```powershell
   docker compose up --build frontend -d
   ```

4. **¿Está el firewall bloqueando la conexión?**
   - Desactiva temporalmente el firewall para probar:
   ```powershell
   # Solo para PRUEBA (vuelve a activarlo después)
   netsh advfirewall set allprofiles state off
   ```
   - Si funciona, el problema es el firewall. Vuelve a activarlo y configura las reglas correctamente:
   ```powershell
   netsh advfirewall set allprofiles state on
   ```

5. **¿Está Docker Desktop corriendo?**
   - Abre Docker Desktop y verifica que los contenedores estén activos

---

### ❌ El frontend carga pero no se conecta al backend

**Causa:** El navegador del dispositivo remoto intenta conectarse a `localhost:8000`, que no existe en ese dispositivo.

**Solución:**
1. Verifica que el `VITE_API_URL` en `docker-compose.yml` use tu IP (no `localhost`)
2. Reconstruye el frontend:
   ```powershell
   docker compose up --build frontend -d
   ```
3. Limpia el caché del navegador en el dispositivo remoto (Ctrl + Shift + Delete)

---

### ❌ Mi IP cambió y la aplicación dejó de funcionar

**Causa:** Tu router asignó una IP diferente (DHCP dinámico).

**Soluciones:**

#### Opción 1: Usar el nombre del equipo en lugar de la IP

Encuentra el nombre de tu PC:
```powershell
hostname
```

Ejemplo: `MI-PC`

Modifica `docker-compose.yml`:
```yaml
VITE_API_URL: http://MI-PC.local:8000
```

⚠️ Esto puede no funcionar en todas las redes.

#### Opción 2: Configurar IP estática en tu router

1. Accede a tu router (usualmente `192.168.1.1` o `192.168.0.1`)
2. Busca la sección **DHCP** o **Reserva de IP**
3. Reserva tu IP actual para la MAC de tu PC

#### Opción 3: Volver a encontrar tu IP y reconstruir

```powershell
ipconfig
# Anota la nueva IP
# Modifica docker-compose.yml con la nueva IP
docker compose up --build frontend -d
```

---

## 📱 Acceso desde Dispositivos Móviles

Los mismos pasos aplican para smartphones y tablets:

1. Conéctate a la misma red WiFi
2. Abre el navegador móvil
3. Navega a `http://TU_IP:5173`

**Ejemplo:** `http://192.168.1.100:5173`

---

## 🔒 Consideraciones de Seguridad

⚠️ **Importante:**

- Solo expón estos puertos en redes **privadas y confiables**
- **NO** expongas estos puertos en redes públicas (cafeterías, aeropuertos, etc.)
- Para producción o acceso por internet, usa:
  - HTTPS con certificados SSL
  - Autenticación robusta
  - Firewall adecuado
  - Considera usar un VPN

---

## 📊 Verificación Final

Lista de verificación para confirmar que todo funciona:

- [ ] Encontré mi IP local: `ipconfig`
- [ ] Modifiqué `VITE_API_URL` en `docker-compose.yml` con mi IP
- [ ] Reconstruí el frontend: `docker compose up --build -d`
- [ ] Configuré las reglas del firewall para los puertos 5173 y 8000
- [ ] Los contenedores están corriendo: `docker compose ps`
- [ ] Puedo acceder desde mi PC: `http://localhost:5173`
- [ ] Puedo acceder desde otro dispositivo: `http://MI_IP:5173`
- [ ] El frontend se conecta al backend correctamente

---

## 🆘 Ayuda Adicional

Si sigues teniendo problemas:

1. **Verifica los logs:**
   ```powershell
   docker compose logs -f
   ```

2. **Verifica la conectividad de red:**
   Desde el otro dispositivo, haz ping a tu PC:
   ```bash
   ping 192.168.1.100
   ```
   Si no responde, hay un problema de red (no de Docker).

3. **Prueba con el navegador de tu PC:**
   Usa tu IP en lugar de localhost:
   ```
   http://192.168.1.100:5173
   ```
   Si funciona, el problema está en el dispositivo remoto.

---

**¡Listo! Ahora tu aplicación es accesible desde cualquier dispositivo en tu red local. 🎉**
