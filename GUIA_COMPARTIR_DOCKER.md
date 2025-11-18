# 📤 Guía para Compartir Docker - Restaurante Don Pepe

Esta guía explica cómo compartir tu aplicación Docker con otras personas.

---

## 🎯 Métodos de Distribución

### Método 1: Compartir Repositorio Git (Recomendado) ⭐

**Ventajas:** Simple, incluye código fuente, fácil de actualizar
**Desventajas:** La otra persona debe construir las imágenes (toma 5-10 minutos)

#### Para ti (compartir):
```bash
# Ya lo hiciste con git push
# Solo comparte el enlace del repositorio
```

#### Para la otra persona (recibir):
```bash
# 1. Clonar el repositorio
git clone https://github.com/Erserady/MOPI---Versiones.git
cd MOPI---Versiones

# 2. Crear archivo de configuración
cp .env.production.example .env.backend
# Editar .env.backend con sus valores

# 3. (Opcional) Configurar para acceso en red local
# Editar docker-compose.yml línea 55 con su IP

# 4. Construir y levantar contenedores
docker compose up --build -d

# 5. (Opcional) Cargar datos de prueba
docker compose exec backend python manage.py populate_all_data
```

**Enlace del repositorio:**
```
https://github.com/Erserady/MOPI---Versiones.git
```

---

### Método 2: Exportar Imágenes Docker a Archivos 📦

**Ventajas:** La otra persona no necesita construir nada, solo importar
**Desventajas:** Archivos grandes (~500MB-1GB), difícil actualizar

#### Paso 1: Exportar las imágenes

```powershell
# Ejecuta el script de exportación
.\exportar-imagenes.ps1
```

Esto creará una carpeta `docker-images-export` con:
- `mopi-backend.tar` (~300-400 MB)
- `mopi-frontend.tar` (~100-200 MB)
- `postgres-16-alpine.tar` (~100 MB)
- `docker-compose.yml`
- Documentación

#### Paso 2: Comprimir y compartir

```powershell
# Comprime la carpeta a ZIP
Compress-Archive -Path docker-images-export -DestinationPath MOPI-Docker.zip
```

Comparte el archivo `MOPI-Docker.zip` por:
- Google Drive
- Dropbox
- WeTransfer
- USB

#### Paso 3: Instrucciones para la otra persona

1. **Descomprimir el ZIP**
2. **Abrir PowerShell en la carpeta extraída**
3. **Ejecutar:**
   ```powershell
   .\importar-imagenes.ps1
   ```
4. **Configurar su IP en `docker-compose.yml` (si necesita acceso en red)**
5. **Crear `.env.backend` con sus variables**
6. **Levantar contenedores:**
   ```powershell
   docker compose up -d
   ```

---

### Método 3: Publicar en Docker Hub 🐳

**Ventajas:** Fácil de compartir y actualizar, acceso desde cualquier lugar
**Desventajas:** Imágenes públicas (a menos que uses cuenta premium)

#### Paso 1: Crear cuenta en Docker Hub

1. Ve a https://hub.docker.com/
2. Crea una cuenta gratuita
3. Anota tu username

#### Paso 2: Login desde tu PC

```powershell
docker login
# Ingresa tu username y password
```

#### Paso 3: Etiquetar tus imágenes

```powershell
# Reemplaza 'TU_USERNAME' con tu usuario de Docker Hub
docker tag mopi-backend TU_USERNAME/mopi-backend:latest
docker tag mopi-frontend TU_USERNAME/mopi-frontend:latest
```

#### Paso 4: Publicar imágenes

```powershell
docker push TU_USERNAME/mopi-backend:latest
docker push TU_USERNAME/mopi-frontend:latest
```

#### Paso 5: Compartir instrucciones

Crea un archivo `docker-compose.prod.yml`:

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: mopi_postgres
    environment:
      POSTGRES_DB: mopi_db
      POSTGRES_USER: mopi_user
      POSTGRES_PASSWORD: mopi_pass
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - mopi_network

  backend:
    image: TU_USERNAME/mopi-backend:latest  # ⬅️ Tu imagen de Docker Hub
    container_name: mopi_backend
    env_file:
      - .env.backend
    depends_on:
      - db
    ports:
      - "8000:8000"
    networks:
      - mopi_network

  frontend:
    image: TU_USERNAME/mopi-frontend:latest  # ⬅️ Tu imagen de Docker Hub
    container_name: mopi_frontend
    depends_on:
      - backend
    ports:
      - "5173:80"
    networks:
      - mopi_network

volumes:
  pgdata:

networks:
  mopi_network:
    driver: bridge
```

**La otra persona solo necesita:**

```bash
# 1. Descargar docker-compose.prod.yml
# 2. Crear .env.backend
# 3. Ejecutar:
docker compose -f docker-compose.prod.yml up -d
```

---

### Método 4: Script Todo-en-Uno para la Otra Persona 🚀

Crea un script `instalar-mopi.ps1` que automatice todo:

```powershell
# instalar-mopi.ps1
Write-Host "Instalando MOPI - Restaurante Don Pepe..." -ForegroundColor Cyan

# Verificar Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker no está instalado" -ForegroundColor Red
    exit 1
}

# Clonar repositorio
git clone https://github.com/Erserady/MOPI---Versiones.git
cd MOPI---Versiones

# Configurar
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" } | Select-Object -First 1).IPAddress
(Get-Content docker-compose.yml) -replace "http://localhost:8000", "http://${ip}:8000" | Set-Content docker-compose.yml

# Crear .env básico
@"
DEBUG=False
SECRET_KEY=change-this-in-production
DATABASE_URL=postgresql://mopi_user:mopi_pass@db:5432/mopi_db
ALLOWED_HOSTS=*
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://${ip}:5173
"@ | Out-File -FilePath .env.backend

# Levantar
docker compose up --build -d

Write-Host "✅ Instalación completada" -ForegroundColor Green
Write-Host "Accede en: http://${ip}:5173" -ForegroundColor Cyan
```

---

## 📋 Comparación de Métodos

| Método | Facilidad | Tamaño | Actualización | Privacidad |
|--------|-----------|--------|---------------|------------|
| **Git** | ⭐⭐⭐⭐ | ~5 MB | ⭐⭐⭐⭐⭐ | ⚠️ Pública |
| **Archivos .tar** | ⭐⭐⭐ | ~1 GB | ⭐ | ✅ Privada |
| **Docker Hub** | ⭐⭐⭐⭐⭐ | - | ⭐⭐⭐⭐⭐ | ⚠️ Pública |
| **Script Auto** | ⭐⭐⭐⭐⭐ | ~5 MB | ⭐⭐⭐⭐ | ⚠️ Pública |

---

## 🎯 Recomendaciones

### Para desarrollo y colaboración:
✅ **Usar Git** (Método 1)

### Para demostración rápida sin internet:
✅ **Exportar imágenes** (Método 2)

### Para producción y distribución amplia:
✅ **Docker Hub** (Método 3)

### Para usuarios no técnicos:
✅ **Script automatizado** (Método 4)

---

## ⚠️ Consideraciones de Seguridad

Si compartes públicamente:
- ❌ **NO incluyas** archivos `.env` con contraseñas reales
- ❌ **NO incluyas** `SECRET_KEY` de producción
- ✅ **SÍ incluye** `.env.production.example` con valores de ejemplo
- ✅ **SÍ documenta** qué variables deben cambiar

---

## 🆘 Soporte para la Otra Persona

Comparte estos archivos de documentación:
- `DOCKER_README.md` - Guía completa de Docker
- `GUIA_ACCESO_RED_LOCAL.md` - Para acceso desde otros dispositivos
- `CREDENCIALES_USUARIOS.md` - Usuarios de prueba

---

## ✅ Checklist Antes de Compartir

- [ ] El repositorio está actualizado (`git push`)
- [ ] No hay contraseñas reales en el código
- [ ] Existe `.env.production.example`
- [ ] La documentación está completa
- [ ] Has probado que funciona desde cero
- [ ] Incluyes instrucciones claras de instalación

---

**¡Listo! Elige el método que mejor se adapte a tus necesidades. 🎉**
