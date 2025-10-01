Para el uso de git. Estos son los comandos generales
1. Configuración inicial:
git init: Inicializa un nuevo repositorio de Git en el directorio actual.
git config --global user.name "Tu Nombre": Configura tu nombre para los commits.
git config --global user.email "tu.email@ejemplo.com": Configura tu correo para los commits.

2. Gestión del repositorio:
git clone <URL>: Clona un repositorio remoto a tu máquina local.
git status: Muestra el estado actual del repositorio (archivos modificados, en etapa, etc.).
git add <archivo>: Añade un archivo específico al área de preparación (staging).
git add .: Añade todos los archivos modificados al área de preparación.
git commit -m "Mensaje del commit": Guarda los cambios preparados en el repositorio con un mensaje descriptivo.
git commit -am "Mensaje": Combina git add . y git commit para archivos ya rastreados.

3. Trabajo con ramas:
git branch: Lista todas las ramas locales.
git branch <nombre-rama>: Crea una nueva rama.
git checkout <nombre-rama>: Cambia a la rama especificada.
git checkout -b <nombre-rama>: Crea y cambia a una nueva rama en un solo paso.
git merge <nombre-rama>: Fusiona la rama especificada en la rama actual.
git branch -d <nombre-rama>: Elimina una rama local.

4. Sincronización con repositorios remotos:
git remote add origin <URL>: Vincula un repositorio local con un repositorio remoto.
git push origin <rama>: Envía los cambios locales a la rama especificada en el repositorio remoto.
git pull origin <rama>: Descarga y fusiona los cambios del repositorio remoto a la rama local.
git fetch origin: Descarga los cambios del repositorio remoto sin fusionarlos.

5. Inspección y comparación:
git log: Muestra el historial de commits.
git diff: Muestra las diferencias entre los cambios no confirmados y el último commit.
git diff <rama1> <rama2>: Compara las diferencias entre dos ramas.

6. Deshacer cambios:
git restore <archivo>: Descarta los cambios en un archivo no preparado.
git restore --staged <archivo>: Saca un archivo del área de preparación.
git reset HEAD^: Deshace el último commit, pero mantiene los cambios en el directorio de trabajo.
git revert <hash-commit>: Crea un nuevo commit que deshace los cambios de un commit específico.

7. Otros comandos útiles:
git stash: Guarda temporalmente los cambios no confirmados.
git stash pop: Recupera los cambios guardados con stash.
git clean -f: Elimina archivos no rastreados del directorio de trabajo.
