# Guía completa del proyecto ApostApp

**Proyecto Final — Programación III — UTN FRSN**

---

## Visión general

Es una aplicación de **apuestas deportivas** con arquitectura **cliente-servidor**:

```
Navegador (HTML + CSS + JS)  →  fetch  →  API Express (Node.js)  →  SQLite
```

- **Frontend:** páginas estáticas + `main.js` que consume la API.
- **Backend:** API REST en capas (rutas → controladores → modelos → base).
- **Base de datos:** SQLite en un archivo local (no SQL Server).

---

## Carpetas principales

### Raíz del proyecto (`PROYECTO FINAL/`)

| Carpeta / archivo | Para qué sirve |
|-------------------|----------------|
| `index.html` | Página principal: apuesta destacada, vigentes y cerradas |
| `login.html` | Inicio de sesión + perfiles rápidos |
| `registro.html` | Registro de usuarios (hoy está roto: es copia del login) |
| `apuesta.html` | Detalle de una apuesta y formulario para apostar |
| `admin.html` | Panel admin: crear/cerrar apuestas, ver usuarios |
| `INSTRUCCIONES.md` | Cómo ejecutar el proyecto (para los profes) |
| `.gitignore` | Excluye `node_modules`, `.env`, `backend/data/` |

### `css/`

| Archivo | Rol |
|---------|-----|
| `styles.css` | Todos los estilos: header, cards, admin, login, footer sticky, responsive |

### `js/`

| Archivo | Rol |
|---------|-----|
| `main.js` | **Todo el frontend:** API calls, login, renderizado, admin, apostar |

### `sql/`

| Archivo | Rol |
|---------|-----|
| `sqlite_schema.sql` | Crea las 4 tablas si no existen |
| `sqlite_seed.sql` | Datos iniciales (solo si la base está vacía) |

### `backend/`

| Carpeta | Rol |
|---------|-----|
| `server.js` | Punto de entrada: Express, middlewares, rutas, puerto 3000 |
| `config/` | Conexión e inicialización de SQLite |
| `routes/` | Define URLs de la API y qué middleware usa cada una |
| `controllers/` | Lógica de negocio HTTP: validar, responder JSON |
| `models/` | Consultas SQL (SELECT, INSERT, UPDATE) |
| `middlewares/` | Auth y manejo de errores |
| `utils/` | Exportar base a `datos.json` |
| `data/` | `sistema_apuestas.db` + `datos.json` (generados al correr) |

---

## Modelo de datos (4 tablas)

```
Usuarios          → quién usa la app (admin / usuario)
Apuestas          → evento (ej: "Argentina vs Alemania")
ApuestaPronostico → opciones (ej: "Argentina", "Alemania") + dividendo
ApuestasUsuarios  → cada apuesta de un usuario (monto + pronóstico elegido)
```

**Relaciones:**

- Una **Apuesta** tiene varios **Pronósticos**.
- Un **Usuario** apuesta en un **Pronóstico** → registro en **ApuestasUsuarios**.

---

## Flujo de una request (ejemplo: apostar)

```
1. Usuario hace clic en "Confirmar apuesta" (apuesta.html)
2. main.js → POST /api/pronosticos/apostar + headers { usuario: id }
3. pronosticoRoutes → verificarLogin (middleware)
4. pronosticoController.apostar → valida monto, estado vigente
5. pronosticoModel.apostar → INSERT en ApuestasUsuarios
6. pronosticoModel.actualizarDividendo → recalcula dividendos
7. sincronizarJson() → actualiza datos.json
8. res.json({ mensaje: "..." }) → frontend muestra éxito
```

---

## Archivos del backend (detalle)

### `server.js`

- Crea la app Express.
- `cors()` → permite que el frontend (puerto 5500) llame al backend (3000).
- `express.json()` → parsea body JSON.
- Monta rutas: `/api/usuarios`, `/api/apuestas`, `/api/pronosticos`.
- Escucha en puerto **3000**.

### `config/db.js`

- Abre `backend/data/sistema_apuestas.db` con **better-sqlite3**.
- Ejecuta `sqlite_schema.sql`.
- Si no hay usuarios → ejecuta `sqlite_seed.sql`.
- Al terminar → genera `datos.json`.

**Código esencial:**

```javascript
const db = new Database(DB_PATH);
db.prepare("SELECT ... WHERE id = ?").get(id);  // leer uno
db.prepare("INSERT ...").run(valor1, valor2);    // escribir
```

### `routes/usuarioRoutes.js`

| Método | Ruta | Acción |
|--------|------|--------|
| POST | `/login` | Login |
| POST | `/registro` | Alta usuario |
| GET | `/` | Listar usuarios |

### `routes/apuestaRoutes.js`

| Método | Ruta | Auth | Acción |
|--------|------|------|--------|
| GET | `/vigentes` | Pública | Listar vigentes |
| GET | `/cerradas` | Pública | Listar cerradas |
| GET | `/:id` | Pública | Detalle + pronósticos + pozo |
| POST | `/` | Admin | Crear apuesta |
| PUT | `/:id/destacar` | Admin | Marcar destacada |
| PUT | `/:id/cerrar` | Admin | Cerrar apuesta |

### `routes/pronosticoRoutes.js`

| Método | Ruta | Auth | Acción |
|--------|------|------|--------|
| POST | `/apostar` | Usuario logueado | Registrar apuesta |

### `middlewares/authMiddleware.js`

No usa JWT ni sesiones en servidor. Lee **headers** enviados por el frontend:

```javascript
req.headers["usuario"]  // id del usuario → verificarLogin
req.headers["rol"]      // debe ser "admin" → verificarAdmin
```

### `middlewares/errorMiddleware.js`

- `rutaNoEncontrada` → 404 JSON.
- `manejarErrores` → 500 JSON.

### `controllers/usuarioController.js`

- **login:** busca por email, compara password en texto plano, devuelve `{ id, nombre, email, rol }`.
- **registro:** valida mayor de 18, email único, crea usuario.
- **obtenerTodos:** lista usuarios (incluye password → solo para demo).

### `controllers/apuestaController.js`

- **obtenerPorId:** apuesta + pronósticos + `pozoBruto` (suma de montos).
- **crear:** inserta apuesta y N pronósticos (mínimo 2).
- **destacar / cerrar:** UPDATE en la tabla Apuestas.

### `controllers/pronosticoController.js`

- Valida monto (1–100000).
- Verifica que la apuesta esté `vigente`.
- Guarda apuesta y recalcula dividendos.

### `models/usuarioModel.js`

SQL directo: `obtenerTodos`, `obtenerPorEmail`, `crear`.

### `models/apuestaModel.js`

CRUD de apuestas: vigentes, cerradas, crear, destacar, cerrar.

### `models/pronosticoModel.js` — lógica importante

**Dividendo (sistema parimutuel):**

```javascript
pozoBruto = suma de todos los montos apostados
pozoNeto  = pozoBruto - 10%   // comisión de la casa
dividendo = pozoNeto / totalApostadoEnEsePronostico
```

**Ejemplo:** si en "Argentina" se apostó $500 y el pozo neto es $720 → dividendo = 720/500 = **1.44x**.

### `utils/exportarDatos.js`

Lee las 4 tablas y escribe `backend/data/datos.json` con timestamp `actualizado`. Se llama al iniciar el servidor y después de cada cambio en la base.

---

## Archivos del frontend

### `index.html`

Estructura: header, sección destacada, grids `#apuestasVigentes` y `#apuestasCerradas`. El HTML inicial es placeholder; `main.js` lo reemplaza con datos reales.

### `login.html`

Formulario email/password + contenedor `#perfilesBotones` (usuarios cargados desde la API).

### `apuesta.html`

Título, pronósticos, input de monto, botón confirmar. El `id` de la apuesta viene de URL, hash o `sessionStorage`.

### `admin.html`

4 tabs: vigentes, cerradas, crear apuesta, usuarios. Tabla y formularios; contenido dinámico desde JS.

### `js/main.js` — funciones clave

| Función | Qué hace |
|---------|----------|
| `DOMContentLoaded` | Detecta página y llama al `iniciar*` correspondiente |
| `actualizarHeader()` | Nav según si hay sesión (localStorage) |
| `iniciarIndex()` | Carga vigentes, cerradas y destacada |
| `iniciarLogin()` | POST login, guarda en `localStorage` |
| `iniciarApuesta()` | GET detalle, permite elegir pronóstico y apostar |
| `iniciarAdmin()` | Carga tabs admin, protege si no es admin |
| `headersAdmin()` | Header `rol: admin` para rutas admin |
| `headersAuth()` | Header `usuario: id` para apostar |
| `verApuesta(id)` | Guarda id en `sessionStorage` y va a `apuesta.html` |
| `cerrarSesion()` | Borra `localStorage` |

**Sesión en el navegador:**

```javascript
localStorage.setItem("usuarioActual", JSON.stringify(data));  // al login
sessionStorage.setItem("apuestaId", id);                       // al ver apuesta
```

**Patrón fetch típico:**

```javascript
const res = await fetch(`${API}/apuestas/vigentes`);
const apuestas = await res.json();
// construir HTML con template strings y innerHTML
```

### `css/styles.css`

- Colores principales: `#1a1a2e` (oscuro), `#e94560` (acento rojo).
- `.header` sticky, `.apuestas-grid`, `.destacada`, tabs admin.
- Footer al fondo de la página:

```css
body { min-height: 100vh; display: flex; flex-direction: column; }
.contenido { flex: 1; }
.footer { margin-top: auto; }
```

---

## Conceptos importantes para el oral / parcial

1. **Arquitectura en capas:** Routes → Controllers → Models → DB.
2. **REST:** GET lee, POST crea, PUT actualiza; respuestas JSON + códigos HTTP (200, 201, 400, 401, 403, 404, 500).
3. **CORS:** necesario porque frontend (5500) y backend (3000) son orígenes distintos.
4. **SQLite:** base en archivo; `better-sqlite3` con prepared statements (`?` evita SQL injection).
5. **Auth simple:** headers custom, no JWT; el frontend manda `rol` y `usuario`.
6. **Parimutuel:** el pozo se reparte entre ganadores; 10% comisión; dividendo dinámico.
7. **Estados de apuesta:** `vigente` (se puede apostar) / `cerrada` (no).
8. **Seed vs DB:** el `.sql` solo corre si la base está vacía; después todo va al `.db`.

---

## Mapa mental rápido

```
HTML (vista)
    ↓
main.js (lógica cliente)
    ↓ fetch
server.js
    ↓
routes + middlewares
    ↓
controllers
    ↓
models
    ↓
sistema_apuestas.db
    ↓
datos.json (copia legible)
```

---

## Endpoints de la API (referencia)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/usuarios/login` | Iniciar sesión |
| POST | `/api/usuarios/registro` | Registrar usuario |
| GET | `/api/usuarios` | Listar usuarios |
| GET | `/api/apuestas/vigentes` | Apuestas vigentes |
| GET | `/api/apuestas/cerradas` | Apuestas cerradas |
| GET | `/api/apuestas/:id` | Detalle de apuesta |
| POST | `/api/apuestas` | Crear apuesta (admin) |
| PUT | `/api/apuestas/:id/destacar` | Destacar (admin) |
| PUT | `/api/apuestas/:id/cerrar` | Cerrar apuesta (admin) |
| POST | `/api/pronosticos/apostar` | Realizar apuesta |

---

## Usuarios de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | `admin@email.com` | `admin123` |
| Usuario | `tomas@email.com` | `user123` |
| Usuario | `fabricio@email.com` | `user123` |

---

## Cosas a tener en cuenta al estudiar

- **`registro.html`** no tiene formulario de registro real (bug pendiente).
- Las **contraseñas** están en texto plano (aceptable para demo, no en producción).
- **`backend/data/`** no va a Git; cada uno genera su base al correr.
- El admin se identifica con header `rol: admin`, no con un token firmado.
- **`sistema_apuestas.db`** es la fuente de verdad; **`datos.json`** es solo una copia exportada.

---

## Cómo ejecutar (resumen)

Ver archivo **`INSTRUCCIONES.md`** para el paso a paso completo.

**Terminal 1 — Backend:**

```bash
cd backend
npm install
npm start
```

**Terminal 2 — Frontend:**

```bash
npx serve -l 5500
```

Abrir **http://localhost:5500** en el navegador.
