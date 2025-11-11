# Dockerfile para Backend Django - Restaurante Don Pepe
FROM python:3.12-slim AS base

# Variables de entorno para Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Establecer directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema necesarias para PostgreSQL y compilación
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar archivo de dependencias
# Usar requirements_updated.txt que contiene todas las dependencias necesarias
COPY requirements_updated.txt requirements.txt

# Instalar dependencias de Python (gunicorn ya está en requirements_updated.txt)
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código de la aplicación
COPY . .

# Crear directorio para archivos estáticos
RUN mkdir -p staticfiles

# Recolectar archivos estáticos
RUN python manage.py collectstatic --noinput || true

# Copiar y dar permisos al script de inicio
COPY docker/entrypoint.sh /app/docker/entrypoint.sh
RUN chmod +x /app/docker/entrypoint.sh

# Exponer puerto 8000
EXPOSE 8000

# Comando por defecto
CMD ["/app/docker/entrypoint.sh"]
