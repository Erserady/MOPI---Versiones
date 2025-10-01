******** Servidor de pruebas usando SQLite ********
- Crear entorno virtual en visual

python -m venv .venv

.venv\Scripts\activate

- Instalar dependencias
pip install -r requeriments.txt

- Migrar base de datos:
python manage.py makemigrations
python manage.py migrate

- Crear super usuario
python manage.py createsuperuser

- Correr el servidor
python manage.py runserver

!!! Se usa como entorno de desarrollo el visual studio
