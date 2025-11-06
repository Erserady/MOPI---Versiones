# Frontend - MOPI Restaurante Don Pepe

## ­ƒÜÇ Despliegue en Render (Static Site)

### Comandos de construcci+¦n

```bash
npm install && npm run build
```

### Directorio de publicaci+¦n

```
dist
```

### Variables de Entorno

```env
VITE_API_URL=https://tu-backend.onrender.com
```

### Configuraci+¦n de Rewrites

Para que React Router funcione correctamente en producci+¦n:

```
/*  /index.html  200
```

## ­ƒöº Desarrollo Local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env`:

```env
VITE_API_URL=http://localhost:8000
```

### 3. Ejecutar servidor de desarrollo

```bash
npm run dev
```

El frontend estar+í disponible en: `http://localhost:5173`

### 4. Otros comandos

```bash
npm run build      # Construir para producci+¦n
npm run preview    # Preview de la build
npm run lint       # Ejecutar linter
```

## ­ƒôü Estructura del Proyecto

```
Frontend/
Ôö£ÔöÇÔöÇ src/
Ôöé   Ôö£ÔöÇÔöÇ config/
Ôöé   Ôöé   ÔööÔöÇÔöÇ api.js              # Configuraci+¦n de API
Ôöé   Ôö£ÔöÇÔöÇ components/
Ôöé   Ôöé   ÔööÔöÇÔöÇ UserSelectionModal.jsx
Ôöé   Ôö£ÔöÇÔöÇ views/
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ login_view/
Ôöé   Ôöé   Ôöé   ÔööÔöÇÔöÇ Login.jsx       # Vista de login
Ôöé   Ôöé   ÔööÔöÇÔöÇ admin_dashboard/
Ôöé   Ôöé       ÔööÔöÇÔöÇ AdminDashboardPreview.jsx
Ôöé   Ôö£ÔöÇÔöÇ styles/                 # Archivos CSS
Ôöé   Ôö£ÔöÇÔöÇ router/
Ôöé   Ôöé   ÔööÔöÇÔöÇ AppRouter.jsx       # Configuraci+¦n de rutas
Ôöé   Ôö£ÔöÇÔöÇ App.jsx                 # Componente principal
Ôöé   ÔööÔöÇÔöÇ main.jsx                # Entry point
Ôö£ÔöÇÔöÇ public/                     # Archivos p+¦blicos
Ôö£ÔöÇÔöÇ index.html                  # HTML base
Ôö£ÔöÇÔöÇ vite.config.js              # Configuraci+¦n de Vite
Ôö£ÔöÇÔöÇ package.json                # Dependencias
ÔööÔöÇÔöÇ .env.example                # Ejemplo de variables de entorno
```

## ­ƒöî Configuraci+¦n de API

El archivo `src/config/api.js` centraliza la configuraci+¦n de la API:

```javascript
// Detecta automaticamente el entorno
const rawBaseUrl =
  import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim().length > 0
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:8000';

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

// Endpoints disponibles
export const API_ENDPOINTS = {
  login: `${API_BASE_URL}/api/users/login/`,
  verifyPin: `${API_BASE_URL}/api/users/verify-pin/`,
  usersByRole: (role) => `${API_BASE_URL}/api/users/by-role/?role=${role}`,
};
```

### Uso en componentes

```javascript
import { API_ENDPOINTS, apiFetch } from '../config/api';

// Hacer petici+¦n
const response = await apiFetch(API_ENDPOINTS.login, {
  method: 'POST',
  body: JSON.stringify({ username, password }),
});
```

## ­ƒÄ¿ Tecnolog+¡as

- **React 19.1.1** - Librer+¡a UI
- **Vite 7.1.12** - Build tool y dev server
- **React Router 7.8.2** - Navegaci+¦n
- **Redux Toolkit 2.9.0** - Gesti+¦n de estado
- **Lucide React 0.542.0** - Iconos
- **SWC** - Compilador r+ípido de JavaScript

## ­ƒîÉ Variables de Entorno

### Desarrollo (`.env`)
```env
VITE_API_URL=http://localhost:8000
```

### Producci+¦n (Render)
```env
VITE_API_URL=https://backend-mopi.onrender.com
```

> ÔÜá´©Å **Importante:** Las variables en Vite deben empezar con `VITE_`

## ­ƒôï Checklist Pre-Despliegue

- [ ] `.env` configurado con URL del backend
- [ ] `npm run build` ejecuta sin errores
- [ ] No hay console.errors en producci+¦n
- [ ] Todas las rutas de la API usan `API_ENDPOINTS`
- [ ] Frontend se conecta correctamente al backend
- [ ] CORS configurado en el backend

## ­ƒÉø Troubleshooting

### Error: Cannot read properties of undefined (reading 'env')

**Causa:** Variables de entorno no configuradas

**Soluci+¦n:**
1. Verifica que `.env` exista
2. Aseg+¦rate de que las variables empiecen con `VITE_`
3. Reinicia el servidor de desarrollo

### Error: Network request failed / CORS

**Causa:** CORS no configurado en el backend

**Soluci+¦n:**
1. Verifica `CORS_ALLOWED_ORIGINS` en el backend
2. Incluye la URL exacta del frontend (sin `/` al final)
3. Redesplega el backend

### Build falla con error de m+¦dulo

**Soluci+¦n:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## ­ƒÄ» Flujo de Autenticaci+¦n

1. Usuario ingresa credenciales en `/login`
2. Frontend env+¡a POST a `API_ENDPOINTS.login`
3. Backend valida y retorna token
4. Token se guarda en `localStorage`
5. Usuario redirigido a `/admin-preview`
6. Selecci+¦n de usuario por rol
7. Verificaci+¦n de PIN v+¡a `API_ENDPOINTS.verifyPin`
8. Acceso al dashboard correspondiente

## ­ƒô¦ Rutas Disponibles

- `/` - Login
- `/admin-preview` - Selecci+¦n de m+¦dulo (admin)
- `/cook-dashboard` - Dashboard cocina
- `/waiter-dashboard` - Dashboard meseros
- `/cashier-dashboard` - Dashboard caja
- `/admin-dashboard` - Dashboard administrador

## ­ƒöÆ Seguridad

- Ô£à Token almacenado en localStorage
- Ô£à Validaci+¦n de PIN para acceso a m+¦dulos
- Ô£à URLs de API centralizadas
- Ô£à No hay credenciales en el c+¦digo
- ÔÜá´©Å Considera usar httpOnly cookies para mayor seguridad

## ­ƒôØ Notas

- Vite proporciona HMR (Hot Module Replacement) en desarrollo
- SWC mejora significativamente la velocidad de compilaci+¦n
- El frontend es completamente est+ítico despu+®s del build
- Todas las peticiones API se hacen desde el navegador del cliente
