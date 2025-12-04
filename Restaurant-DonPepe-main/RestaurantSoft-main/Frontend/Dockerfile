# Dockerfile para Frontend React - Restaurante Don Pepe

# Etapa 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (permitiendo lock actualizado)
RUN npm install

# Copiar el código fuente
COPY . .

# Argumento de build para la URL del API
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

# Construir la aplicación
RUN npm run build

# Etapa 2: Producción con Nginx
FROM nginx:1.27-alpine

# Copiar configuración personalizada de Nginx
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos construidos desde la etapa de build
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer puerto 80
EXPOSE 80

# Nginx se ejecuta en primer plano por defecto
CMD ["nginx", "-g", "daemon off;"]
