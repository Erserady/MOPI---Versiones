# Frontend - MOPI Restaurante Don Pepe

## 🚀 Despliegue en Render (Static Site)

### Comandos de construcción

```bash
npm install && npm run build
```

### Directorio de publicación

```
dist
```

### Variables de Entorno

```env
VITE_API_URL=https://tu-backend.onrender.com
```

### Configuración de Rewrites

Para que React Router funcione correctamente en producción:

```
/*  /index.html  200
```

## 🔧 Desarrollo Local

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

El frontend estará disponible en: `http://localhost:5173`

### 4. Otros comandos

```bash
npm run build      # Construir para producción
npm run preview    # Preview de la build
npm run lint       # Ejecutar linter
```

## 📁 Estructura del Proyecto

```
Frontend/
├── src/
│   ├── config/
│   │   └── api.js              # Configuración de API
│   ├── components/
│   │   └── UserSelectionModal.jsx
│   ├── views/
│   │   ├── login_view/
│   │   │   └── Login.jsx       # Vista de login
│   │   └── admin_dashboard/
│   │       └── AdminDashboardPreview.jsx
│   ├── styles/                 # Archivos CSS
│   ├── router/
│   │   └── AppRouter.jsx       # Configuración de rutas
│   ├── App.jsx                 # Componente principal
│   └── main.jsx                # Entry point
├── public/                     # Archivos públicos
├── index.html                  # HTML base
├── vite.config.js              # Configuración de Vite
├── package.json                # Dependencias
└── .env.example                # Ejemplo de variables de entorno
```

## 🔌 Configuración de API

El archivo `src/config/api.js` centraliza la configuración de la API:

```javascript
// Detecta automáticamente el entorno
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

// Hacer petición
const response = await apiFetch(API_ENDPOINTS.login, {
  method: 'POST',
  body: JSON.stringify({ username, password }),
});
```

## 🎨 Tecnologías

- **React 19.1.1** - Librería UI
- **Vite 7.1.12** - Build tool y dev server
- **React Router 7.8.2** - Navegación
- **Redux Toolkit 2.9.0** - Gestión de estado
- **Lucide React 0.542.0** - Iconos
- **SWC** - Compilador rápido de JavaScript

## 🌐 Variables de Entorno

### Desarrollo (`.env`)
```env
VITE_API_URL=http://localhost:8000
```

### Producción (Render)
```env
VITE_API_URL=https://mopi-backend.onrender.com
```

> ⚠️ **Importante:** Las variables en Vite deben empezar con `VITE_`

## 📋 Checklist Pre-Despliegue

- [ ] `.env` configurado con URL del backend
- [ ] `npm run build` ejecuta sin errores
- [ ] No hay console.errors en producción
- [ ] Todas las rutas de la API usan `API_ENDPOINTS`
- [ ] Frontend se conecta correctamente al backend
- [ ] CORS configurado en el backend

## 🐛 Troubleshooting

### Error: Cannot read properties of undefined (reading 'env')

**Causa:** Variables de entorno no configuradas

**Solución:**
1. Verifica que `.env` exista
2. Asegúrate de que las variables empiecen con `VITE_`
3. Reinicia el servidor de desarrollo

### Error: Network request failed / CORS

**Causa:** CORS no configurado en el backend

**Solución:**
1. Verifica `CORS_ALLOWED_ORIGINS` en el backend
2. Incluye la URL exacta del frontend (sin `/` al final)
3. Redesplega el backend

### Build falla con error de módulo

**Solución:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 🎯 Flujo de Autenticación

1. Usuario ingresa credenciales en `/login`
2. Frontend envía POST a `API_ENDPOINTS.login`
3. Backend valida y retorna token
4. Token se guarda en `localStorage`
5. Usuario redirigido a `/admin-preview`
6. Selección de usuario por rol
7. Verificación de PIN vía `API_ENDPOINTS.verifyPin`
8. Acceso al dashboard correspondiente

## 📱 Rutas Disponibles

- `/` - Login
- `/admin-preview` - Selección de módulo (admin)
- `/cook-dashboard` - Dashboard cocina
- `/waiter-dashboard` - Dashboard meseros
- `/cashier-dashboard` - Dashboard caja
- `/admin-dashboard` - Dashboard administrador

## 🔒 Seguridad

- ✅ Token almacenado en localStorage
- ✅ Validación de PIN para acceso a módulos
- ✅ URLs de API centralizadas
- ✅ No hay credenciales en el código
- ⚠️ Considera usar httpOnly cookies para mayor seguridad

## 📝 Notas

- Vite proporciona HMR (Hot Module Replacement) en desarrollo
- SWC mejora significativamente la velocidad de compilación
- El frontend es completamente estático después del build
- Todas las peticiones API se hacen desde el navegador del cliente
