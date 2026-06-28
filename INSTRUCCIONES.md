# ApostApp — Instrucciones de ejecución

**Proyecto Final — Programación III — UTN FRSN**

Sistema de apuestas deportivas con frontend en HTML/CSS/JavaScript y backend en Node.js + Express + SQLite.

---

## Requisitos previos

- [Node.js](https://nodejs.org/) instalado (versión 18 o superior recomendada)
- Navegador web (Chrome, Firefox, Edge, etc.)
- **No se requiere** SQL Server ni ningún servidor de base de datos externo

Para verificar que Node.js está instalado:

```bash
node -v
npm -v
```

---

## Estructura del proyecto

```
PROYECTO FINAL/
├── frontend/               # HTML, CSS y JavaScript
│   ├── index.html          # Página principal
│   ├── login.html          # Inicio de sesión
│   ├── admin.html          # Panel de administración
│   ├── apuesta.html        # Detalle de apuesta
│   ├── js/
│   │   ├── datos.js        # Lee datos.json y arma la info para la pantalla
│   │   └── main.js         # Lógica del frontend (eventos, API de escritura)
│   └── css/styles.css      # Estilos
├── backend/                # API REST (Node.js)
│   ├── server.js
│   ├── data/
│   │   ├── sistema_apuestas.db   # Base SQLite (se crea sola)
│   │   └── datos.json            # Copia en JSON (tiempo real con la DB)
│   └── package.json
└── sql/
    ├── sqlite_schema.sql   # Esquema de tablas (sin foreign keys)
    └── sqlite_seed.sql     # Datos iniciales
```

---

## Pasos para ejecutar

### Opción recomendada — una sola terminal

1. Abrir terminal en la carpeta `backend`:

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

4. Abrir en el navegador: **http://localhost:3000**

El backend sirve **la página web** y la **API** en el mismo puerto.

> Dejar la terminal abierta. Si vuelve al prompt (`$` o `PS>`), el servidor se detuvo.

---

### Opción alternativa — dos terminales

Si preferís separar frontend y backend:

| Terminal | Comando | URL |
|----------|---------|-----|
| 1 — Backend | `cd backend` → `npm start` | API en http://localhost:3000 |
| 2 — Frontend | `npx serve -l 5500` (desde la raíz) | http://localhost:5500 |

---

## Usuarios de prueba

| Rol     | Email                | Contraseña |
|---------|----------------------|------------|
| Admin   | `admin@email.com`    | `admin123` |
| Usuario | `tomas@email.com`    | `user123`  |
| Usuario | `fabricio@email.com` | `user123`  |

En login hay **acceso rápido** con botones que cargan email y contraseña.

> Si tenías sesión guardada de una versión anterior, cerrá sesión y volvé a entrar.

---

## Funcionalidades principales

### Usuario
- Ver apuestas vigentes, cerradas y destacada (lee `datos.json`)
- Apostar en una ocurrencia (pronóstico)
- Iniciar sesión (los usuarios se cargan manualmente en la base)

### Admin
- Crear apuestas con pronósticos
- Destacar / quitar destacada (solo una a la vez)
- **Cerrar apuesta y definir resultado** (elige qué opción ganó → guarda `GAN`/`PER` por persona)
- Ver usuarios registrados

---

## Cómo funciona la lectura de datos

1. Cada cambio en SQLite actualiza `backend/data/datos.json` automáticamente.
2. Al exportar, el backend calcula pozos y dividendos con `SUM(importe)` en SQL (ver `backend/utils/calcularTotales.js`).
3. El frontend **lee** desde `GET /api/datos` (no usa GET de apuestas/usuarios para listar).
4. Cada 3 segundos el index y el admin revisan si cambió el campo `actualizado` y recargan la pantalla.
5. Las **escrituras** (login, apostar, crear, cerrar) van por la API REST.

---

## Base de datos

- Motor: **SQLite** (archivo local)
- Ubicación: `backend/data/sistema_apuestas.db`
- Se crea al iniciar el backend con `sql/sqlite_schema.sql`
- Datos iniciales: `sql/sqlite_seed.sql` (solo si no hay personas)
- **Sin foreign keys** (modelo del profesor)
- Campos de resultado:
  - `Apuestas_personas.resultado` → `GAN` / `PER`

### Reiniciar datos desde cero

1. Detener el backend (`Ctrl + C`)
2. Borrar `backend/data/sistema_apuestas.db`
3. Ejecutar `npm start` de nuevo

### Agregar usuarios manualmente

Los usuarios **no se registran desde la web**. Se cargan en la base:

1. Editar `sql/sqlite_seed.sql` y agregar filas en `personas`, por ejemplo:

```sql
INSERT INTO personas (persona, apellido, nombre, dni, fecha_nacimiento, mail, telefono, estado, clave)
VALUES (4, 'Pérez', 'Juan', NULL, '2000-01-15', 'juan@email.com', NULL, 'ACT', 'user123');
```

2. Borrar `sistema_apuestas.db` y reiniciar el backend, **o** ejecutar el `INSERT` directo en la base con un cliente SQLite.

- `estado = 'ADM'` → administrador  
- `estado = 'ACT'` → usuario común  
- `clave` → contraseña de login (texto plano, solo para el TP)

---

## Solución de problemas

### Error: `Could not read package.json`

Ejecutaste `npm start` fuera de `backend`. Entrá a esa carpeta primero.

### El backend arranca y se cierra

El puerto 3000 puede estar ocupado:

```bash
netstat -ano | findstr ":3000"
taskkill /PID <número_PID> /F
```

### La página carga pero no muestra apuestas

1. Verificar que el backend esté corriendo.
2. Probar en el navegador: http://localhost:3000/api/datos  
   Debe devolver JSON con `personas`, `apuestas`, `Apuestas_detalle`, `Apuestas_personas`.

### `localhost:3000` muestra `{"error":"Ruta no encontrada"}`

Estás en una ruta de API que no existe. Abrí la raíz: **http://localhost:3000** (sin `/api/...`).

---

## Detener la aplicación

En la terminal del backend: `Ctrl + C`.

---

## Endpoints de la API

### Lectura del JSON (lo usa el frontend)

| Método | Ruta           | Descripción                          |
|--------|----------------|--------------------------------------|
| GET    | `/api/datos`   | Todo el contenido de `datos.json`    |

### Escrituras y autenticación

| Método | Ruta                              | Auth    | Descripción                    |
|--------|-----------------------------------|---------|--------------------------------|
| POST   | `/api/usuarios/login`             | —       | Iniciar sesión                 |
| POST   | `/api/pronosticos/apostar`        | Usuario | Apostar                        |
| POST   | `/api/apuestas`                   | Admin   | Crear apuesta                  |
| PUT    | `/api/apuestas/:apuesta/destacar` | Admin   | Destacar apuesta               |
| PUT    | `/api/apuestas/:apuesta/quitar-destacada` | Admin | Quitar destacada       |
| PUT    | `/api/apuestas/:apuesta/cerrar`   | Admin   | Cerrar y definir resultado     |

**Body al apostar:** `{ persona, ocurrencia, apuesta, monto }`  
**Body al cerrar:** `{ ocurrenciaGanadora }`

> Los endpoints GET de `/api/apuestas/...` y `/api/usuarios` siguen existiendo en el backend, pero el frontend actual **no los usa** para mostrar pantallas; lee el JSON.

---

## Documentación completa

Para entender **cada función y archivo**, ver **`GUIA_ESTUDIO.md`**.
