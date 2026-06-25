# ApostApp — Instrucciones de ejecución

**Proyecto Final — Programación III — UTN FRSN**

Sistema de apuestas deportivas con frontend en HTML/CSS/JavaScript y backend en Node.js + Express + SQLite.

---

## Requisitos previos

- [Node.js](https://nodejs.org/) instalado (versión 18 o superior recomendada)
- Navegador web (Chrome, Firefox, Edge, etc.)
- **No se requiere** SQL Server ni ningún servidor de base de datos externo

Para verificar que Node.js está instalado, abrir una terminal y ejecutar:

```bash
node -v
npm -v
```

---

## Estructura del proyecto

```
PROYECTO FINAL/
├── index.html          # Página principal
├── login.html          # Inicio de sesión
├── admin.html          # Panel de administración
├── apuesta.html        # Detalle de apuesta
├── js/main.js          # Lógica del frontend
├── css/styles.css      # Estilos
├── backend/            # API REST (Node.js)
│   ├── server.js
│   ├── data/           # Base de datos (se crea automáticamente)
│   └── package.json
└── sql/
    ├── sqlite_schema.sql   # Esquema de tablas
    └── sqlite_seed.sql     # Datos iniciales
```

---

## Pasos para ejecutar

Se necesitan **dos terminales abiertas al mismo tiempo**.

### Terminal 1 — Backend (API)

1. Abrir una terminal en la carpeta `backend`:

```bash
cd backend
```

2. Instalar dependencias (solo la primera vez):

```bash
npm install
```

3. Iniciar el servidor:

```bash
npm start
```

Si todo está correcto, se verá:

```
Conectado a SQLite: .../backend/data/sistema_apuestas.db
Servidor corriendo en http://localhost:3000
```

> **Importante:** dejar esta terminal abierta. Si vuelve al prompt (`$` o `PS>`), el servidor se detuvo.

---

### Terminal 2 — Frontend (interfaz web)

1. Abrir **otra terminal** en la carpeta raíz del proyecto (`PROYECTO FINAL`):

```bash
cd ..
```

*(O abrir la terminal directamente en la carpeta raíz, no dentro de `backend`.)*

2. Iniciar el servidor web:

```bash
npx serve -l 5500
```

Se mostrará una URL similar a:

```
Accepting connections at http://localhost:5500
```

3. Abrir esa URL en el navegador: **http://localhost:5500**

> **Importante:** la aplicación web corre en el puerto **5500**. El puerto **3000** es solo la API (devuelve JSON, no la interfaz).

---

## Usuarios de prueba

| Rol        | Email                 | Contraseña |
|------------|-----------------------|------------|
| Admin      | `admin@email.com`     | `admin123` |
| Usuario    | `tomas@email.com`     | `user123`  |
| Usuario    | `fabricio@email.com`  | `user123`  |

En la pantalla de login también hay **acceso rápido** con botones que cargan estos usuarios automáticamente.

---

## Funcionalidades principales

- **Usuario:** ver apuestas vigentes y cerradas, apostar, registrarse
- **Admin:** crear apuestas, destacar, cerrar apuestas, ver usuarios registrados

---

## Base de datos

- Motor: **SQLite** (archivo local)
- Ubicación: `backend/data/sistema_apuestas.db`
- Se crea automáticamente al iniciar el backend por primera vez
- Los datos iniciales se cargan desde `sql/sqlite_seed.sql`
- Copia legible en JSON: `backend/data/datos.json` (se actualiza al modificar datos)

### Reiniciar datos desde cero

1. Detener el backend (`Ctrl + C` en la terminal)
2. Eliminar el archivo `backend/data/sistema_apuestas.db`
3. Volver a ejecutar `npm start` en `backend`

---

## Solución de problemas

### Error: `Could not read package.json`

Se ejecutó `npm start` en la carpeta incorrecta. Debe ejecutarse dentro de `backend`, no en la raíz del proyecto.

### El backend arranca y se cierra al instante

Probablemente el puerto 3000 ya está en uso. En Windows:

```bash
netstat -ano | findstr ":3000"
taskkill /PID <número_PID> /F
```

Luego volver a ejecutar `npm start`.

### La página carga pero no muestra apuestas

Verificar que el backend esté corriendo en http://localhost:3000. Probar en el navegador:

```
http://localhost:3000/api/apuestas/vigentes
```

Debe devolver un JSON con las apuestas.

### El puerto 5500 está ocupado

`serve` puede usar otro puerto automáticamente. Usar la URL que indique la terminal, o probar con otro puerto:

```bash
npx serve -l 8080
```

---

## Detener la aplicación

En cada terminal presionar `Ctrl + C`.

---

## Endpoints de la API (referencia)

| Método | Ruta                        | Descripción              |
|--------|-----------------------------|--------------------------|
| POST   | `/api/usuarios/login`       | Iniciar sesión           |
| POST   | `/api/usuarios/registro`    | Registrar usuario        |
| GET    | `/api/usuarios`             | Listar usuarios          |
| GET    | `/api/apuestas/vigentes`    | Apuestas vigentes        |
| GET    | `/api/apuestas/cerradas`    | Apuestas cerradas        |
| GET    | `/api/apuestas/:id`         | Detalle de apuesta       |
| POST   | `/api/apuestas`             | Crear apuesta (admin)    |
| PUT    | `/api/apuestas/:id/destacar`| Destacar (admin)         |
| PUT    | `/api/apuestas/:id/cerrar`  | Cerrar apuesta (admin)   |
| POST   | `/api/pronosticos/apostar`  | Realizar apuesta         |
