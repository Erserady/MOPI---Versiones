# 📤 Cómo Compartir esta Aplicación Docker

## 🎯 Opción Más Simple (Recomendada)

### Para compartir:
Solo comparte el enlace del repositorio:
```
https://github.com/Erserady/MOPI---Versiones.git
```

### Para la otra persona:
```powershell
# 1. Descargar e instalar Docker Desktop
# https://www.docker.com/products/docker-desktop

# 2. Descargar e instalar Git (opcional)
# https://git-scm.com/downloads

# 3. Abrir PowerShell y ejecutar:
irm https://raw.githubusercontent.com/Erserady/MOPI---Versiones/main/instalar-mopi.ps1 | iex

# O si ya clonaste el repo:
git clone https://github.com/Erserady/MOPI---Versiones.git
cd MOPI---Versiones
.\instalar-mopi.ps1
```

¡Eso es todo! El script hace todo automáticamente. ✨

---

## 📦 Opción Alternativa: Exportar como Archivos

Si la otra persona no tiene internet o prefieres compartir archivos:

### 1. Exportar imágenes:
```powershell
.\exportar-imagenes.ps1
```

### 2. Comprimir:
```powershell
Compress-Archive -Path docker-images-export -DestinationPath MOPI-Docker.zip
```

### 3. Compartir `MOPI-Docker.zip` por:
- Google Drive
- USB
- WeTransfer
- Dropbox

### 4. La otra persona debe:
```powershell
# Descomprimir el ZIP
# Abrir PowerShell en la carpeta
.\importar-imagenes.ps1
.\instalar-mopi.ps1 -MetodoInstalacion local
```

---

## 📚 Documentación Completa

Para más opciones y detalles: **`GUIA_COMPARTIR_DOCKER.md`**

---

## ⚡ Resumen Ultra-Rápido

**Para compartir:** 
- Comparte el link: https://github.com/Erserady/MOPI---Versiones.git

**Para instalar:**
- Instala Docker Desktop
- Ejecuta: `.\instalar-mopi.ps1`
- Accede en: `http://localhost:5173`

**¡Listo! 🎉**
