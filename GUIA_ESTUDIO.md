# Guía completa del proyecto ApostApp

**Proyecto Final — Programación III — UTN FRSN**

Documento para estudiar el proyecto: arquitectura, base de datos, y **qué hace cada función**.

---

## Visión general

Aplicación de **apuestas deportivas** con arquitectura **cliente-servidor**:

```
Navegador (HTML + CSS + JS)
    │
    ├─ LECTURAS  →  GET /api/datos  →  datos.json  ←  SQLite (tiempo real)
    │
    └─ ESCRITURAS →  POST/PUT API   →  Controllers → Models → SQLite → datos.json
```

### Decisiones del modelo del TP

| Requisito | Cómo lo cumplimos |
|-----------|-------------------|
| Leer todo desde JSON | `datos.js` + polling cada 3 s |
| JSON sincronizado con la DB | `exportarDatos.js` después de cada cambio |
| Sin JOIN en SQL | Consultas con `WHERE`; se combina en JS |
| Sin foreign keys | Solo primary keys en el schema |
| Sin campo `id` | Usamos `apuesta`, `persona`, `ocurrencia` |
| Sin JavaScript en el HTML | Eventos en `main.js` con `addEventListener` |
| Resultado al cerrar | Admin elige ganador → `GAN`/`PER` en `Apuestas_personas` |

---

## Carpetas y archivos

### Raíz

| Archivo | Rol |
|---------|-----|
| `INSTRUCCIONES.md` | Cómo ejecutar |
| `GUIA_ESTUDIO.md` | Este archivo |

### `frontend/`

| Archivo | Rol |
|---------|-----|
| `index.html` | Home: destacada, vigentes, cerradas |
| `login.html` | Login + perfiles rápidos |
| `apuesta.html` | Detalle, elegir pronóstico, apostar o ver resultado |
| `admin.html` | Panel admin con 4 pestañas + modal de cierre |
| `js/datos.js` | Descarga `datos.json`, filtra y calcula dividendos/pozos en el navegador |
| `js/main.js` | Eventos, renderizado, login, admin, apostar (escrituras vía API) |
| `css/styles.css` | Estilos de la aplicación |

### `sql/`

| Archivo | Rol |
|---------|-----|
| `sqlite_schema.sql` | Crea las 4 tablas (`CREATE TABLE IF NOT EXISTS`) |
| `sqlite_seed.sql` | Admin, Tomás, Fabricio + apuesta Argentina vs Alemania |

### `backend/`

| Carpeta/archivo | Rol |
|----------------|-----|
| `server.js` | Express, API, sirve el frontend estático en puerto 3000 |
| `config/db.js` | Abre SQLite, ejecuta schema y seed si hace falta |
| `routes/` | URLs de la API |
| `controllers/` | Validaciones HTTP y respuestas JSON |
| `models/` | SQL con `WHERE` (sin JOIN) |
| `middlewares/` | Auth por headers y errores 404/500 |
| `utils/exportarDatos.js` | Escribe `datos.json` |
| `data/` | `.db` y `.json` generados al correr |

---

## Modelo de datos (4 tablas)

```
personas            → usuarios del sistema (estado ADM = admin, ACT = usuario)
apuestas            → eventos (ej: "Argentina vs Alemania")
Apuestas_detalle    → opciones / ocurrencias (ej: "Argentina", "Alemania")
Apuestas_personas   → cada apuesta de una persona (importe + resultado)
```

### Campos importantes

| Tabla | Campo | Valores |
|-------|-------|---------|
| `personas` | `estado` | `ADM` (admin), `ACT` (usuario) |
| `apuestas` | `estado` | `ACT` (activa), `FIN` (cerrada por admin) |
| `apuestas` | `prioridad` | `> 0` = destacada |
| `Apuestas_personas` | `resultado` | `GAN` o `PER` (null si no cerró) |

**Relaciones:** no hay foreign keys en SQL; se relacionan por `apuesta`, `ocurrencia` y `persona` en el código.

---

## Flujos principales

### Ver apuestas en el index

```
1. iniciarIndex() → cargarDatos()
2. datos.js filtra apuestas vigentes/cerradas desde el JSON
3. main.js arma las cards en pantalla
4. iniciarPollingDatos() cada 3 s: si cambió "actualizado", recarga
```

### Apostar

```
1. Usuario elige pronóstico y monto en apuesta.html
2. POST /api/pronosticos/apostar  { persona, ocurrencia, apuesta, monto }
3. pronosticoModel.apostar → INSERT/UPDATE en Apuestas_personas
4. sincronizarJson() → actualiza datos.json
5. Frontend recarga datos y muestra el nuevo pozo/dividendo
```

### Cerrar apuesta (admin)

```
1. Admin clic en "Cerrar y definir resultado" → modal
2. Elige la opción ganadora (descripción, no un "id")
3. PUT /api/apuestas/:apuesta/cerrar  { ocurrenciaGanadora }
4. apuestaModel.cerrar:
   - apuestas.estado = 'FIN'
   - Apuestas_personas.resultado = GAN/PER
5. sincronizarJson()
```

### Dividendo (sistema parimutuel)

```
pozoBruto = suma de todos los importes de la apuesta
pozoNeto  = pozoBruto - 10% comisión
dividendo = pozoNeto / total apostado en ESA ocurrencia
```

---

# Backend — función por función

## `server.js`

| Parte | Qué hace |
|-------|----------|
| `cors()` | Permite que el navegador llame a la API |
| `express.json()` | Lee body JSON en POST/PUT |
| Rutas `/api/*` | Monta usuarios, apuestas, pronósticos, datos |
| `express.static(..)` | Sirve HTML/CSS/JS desde la carpeta `frontend/` |
| `app.listen(3000)` | Arranca el servidor |

---

## `config/db.js`

| Función | Qué hace |
|---------|----------|
| `leerSql(archivo)` | Lee un archivo `.sql` de la carpeta `sql/` |
| `inicializarBase()` | Abre `sistema_apuestas.db`, ejecuta schema; si no hay personas, ejecuta seed |
| `conectar()` | Log de conexión (lo usa `server.js` al iniciar) |

Al cargar el módulo también llama `exportarDatos(db)` para generar el primer `datos.json`.

---

## `utils/exportarDatos.js`

| Función | Qué hace |
|---------|----------|
| `exportarDatos(db)` | Hace 4 `SELECT` (sin JOIN) y escribe `datos.json` con campo `actualizado` |
| `sincronizarJson()` | Vuelve a exportar después de cada INSERT/UPDATE en los models |

---

## `routes/datosRoutes.js`

| Ruta | Qué hace |
|------|----------|
| `GET /` | Devuelve el contenido de `datos.json` (montado en `/api/datos`) |

---

## `routes/usuarioRoutes.js`

| Método | Ruta | Controlador |
|--------|------|-------------|
| POST | `/login` | login |
| GET | `/` | obtenerTodos |

---

## `routes/apuestaRoutes.js`

| Método | Ruta | Middleware | Controlador |
|--------|------|------------|-------------|
| GET | `/vigentes` | — | obtenerVigentes |
| GET | `/cerradas` | — | obtenerCerradas |
| GET | `/:apuesta` | — | obtenerPorApuesta |
| POST | `/` | verificarAdmin | crear |
| PUT | `/:apuesta/destacar` | verificarAdmin | destacar |
| PUT | `/:apuesta/quitar-destacada` | verificarAdmin | quitarDestacada |
| PUT | `/:apuesta/cerrar` | verificarAdmin | cerrar |

---

## `routes/pronosticoRoutes.js`

| Método | Ruta | Middleware | Controlador |
|--------|------|------------|-------------|
| POST | `/apostar` | verificarLogin | apostar |

---

## `middlewares/authMiddleware.js`

| Función | Qué hace |
|---------|----------|
| `verificarLogin` | Exige header `usuario` (número de persona) |
| `verificarAdmin` | Exige header `rol: admin` |

No hay JWT ni sesión en servidor; el frontend guarda el usuario en `localStorage`.

---

## `middlewares/errorMiddleware.js`

| Función | Qué hace |
|---------|----------|
| `rutaNoEncontrada` | Responde 404 `{ error: "Ruta no encontrada" }` |
| `manejarErrores` | Responde 500 ante errores no capturados |

---

## `controllers/usuarioController.js`

| Función | Qué hace |
|---------|----------|
| `login` | Busca por email, compara clave, devuelve `{ persona, nombre, apellido, email, rol }` |
| `obtenerTodos` | Lista usuarios (admin y perfiles rápidos en login) |

---

## `controllers/apuestaController.js`

| Función | Qué hace |
|---------|----------|
| `obtenerVigentes` | Lista apuestas con estado vigente |
| `obtenerCerradas` | Lista apuestas FIN o vencidas por fecha |
| `obtenerPorApuesta` | Una apuesta + pronósticos + apuestas de personas + pozo |
| `crear` | Inserta apuesta y sus ocurrencias (mínimo 2) |
| `destacar` | Pone `prioridad = 1` (solo una destacada vigente) |
| `quitarDestacada` | Pone `prioridad = 0` |
| `cerrar` | Recibe `ocurrenciaGanadora`, llama al model para FIN + S/N + GAN/PER |

---

## `controllers/pronosticoController.js`

| Función | Qué hace |
|---------|----------|
| `apostar` | Valida monto y que la apuesta esté ACT y no vencida; guarda en `Apuestas_personas` |

---

## `models/usuarioModel.js`

| Función | Qué hace |
|---------|----------|
| `obtenerTodos` | `SELECT` de `personas` ordenado por nombre |
| `obtenerPorEmail` | Busca una persona por `mail` |
| `crear` | `INSERT` en `personas` (solo para carga manual vía seed/SQL, no hay pantalla de registro) |

---

## `models/apuestaModel.js`

| Función | Qué hace |
|---------|----------|
| `obtenerTodas` | Todas las apuestas con estado calculado (vigente/cerrada) |
| `obtenerVigentes` | `estado = ACT` y `fecha_cierre >= hoy` |
| `obtenerCerradas` | `estado = FIN` o fecha de cierre pasada |
| `obtenerPorApuesta` | Una fila de `apuestas` por número de apuesta |
| `crear` | `INSERT` en `apuestas`, devuelve el número generado |
| `obtenerDestacadaVigente` | La apuesta vigente con `prioridad > 0` |
| `destacar` | Error si ya hay otra destacada; `UPDATE prioridad = 1` |
| `quitarDestacada` | `UPDATE prioridad = 0` |
| `cerrar` | Valida ocurrencia, `FIN`, `resultado` GAN/PER en personas |
| `obtenerApuestasPersonas` | Filas de `Apuestas_personas` + consultas `WHERE` a persona y detalle |

---

## `models/pronosticoModel.js`

| Función | Qué hace |
|---------|----------|
| `calcularPozoNeto` | Suma importes y resta comisión del 10% |
| `obtenerPorApuesta` | Lista ocurrencias con total apostado y dividendo (sin JOIN) |
| `crear` | Nueva fila en `Apuestas_detalle` (máx. 10 ocurrencias) |
| `actualizarDividendo` | Solo llama `sincronizarJson()` (el dividendo se calcula al leer) |
| `obtenerEstadoApuesta` | Consulta `apuestas` y `Apuestas_detalle` por separado |
| `apostar` | `INSERT` o suma importe si la persona ya apostó esa ocurrencia |

---

# Frontend — `frontend/js/datos.js`

Capa que **lee el JSON** y prepara los datos para la pantalla.

| Función | Qué hace |
|---------|----------|
| `fechaHoy()` | Fecha actual en formato `YYYY-MM-DD` |
| `apuestaVencidaPorFecha(fechaCierre)` | `true` si la fecha de cierre ya pasó |
| `estadoApuestaDesdeJson(apuesta)` | Devuelve `vigente` o `cerrada` según estado y fecha |
| `mapApuesta(apuesta)` | Convierte fila de `apuestas` a objeto con `titulo`, `fechaEvento`, etc. |
| `calcularPozoBruto(datos, numeroApuesta)` | Suma importes en `Apuestas_personas` |
| `calcularPozoNeto(datos, numeroApuesta)` | Pozo bruto menos comisión |
| `obtenerPronosticosDesdeJson(datos, numeroApuesta)` | Ocurrencias con total apostado y dividendo |
| `obtenerApuestasPersonasDesdeJson(datos, numeroApuesta)` | Apuestas de personas con nombre y descripción |
| `obtenerApuestaDetalleDesdeJson(datos, numeroApuesta)` | Apuesta completa para una pantalla de detalle |
| `obtenerUsuariosDesdeJson(datos)` | Lista personas con `persona`, `email`, `rol`, etc. |
| `obtenerApuestasVigentesDesdeJson(datos)` | Filtra y mapea vigentes |
| `obtenerApuestasCerradasDesdeJson(datos)` | Filtra y mapea cerradas |
| `cargarDatos()` | `fetch` a `/api/datos` y guarda en caché |
| `getDatosCache()` | Devuelve el JSON en memoria |
| `getUltimaActualizacion()` | Timestamp del último JSON cargado |
| `obtenerApuestasVigentes()` | Usa caché o recarga y devuelve vigentes |
| `obtenerApuestasCerradas()` | Igual para cerradas |
| `obtenerApuestaPorNumero(numeroApuesta)` | Detalle de una apuesta |
| `obtenerUsuarios()` | Lista de usuarios desde JSON |
| `iniciarPollingDatos(callback, ms)` | Cada 3 s recarga JSON; si cambió `actualizado`, ejecuta callback |

---

# Frontend — `frontend/js/main.js`

## Inicio y navegación

| Función | Qué hace |
|---------|----------|
| `DOMContentLoaded` | Detecta la página y llama al `iniciar*` correspondiente |
| `iniciarEnlacesNavegacion()` | Clic en logo (`.js-link-home`) y botón Volver → `index.html` |
| `esPaginaInicio(pagina)` | `true` si es `/` o `index.html` |
| `obtenerApuestaDesdeUrl()` | Lee `?apuesta=` de la URL o `sessionStorage` |
| `mostrarErrorApuestaPagina(mensaje)` | Muestra error si no hay apuesta |
| `actualizarHeader()` | Arma el menú según sesión (login/admin/logout) |
| `redirigirSiYaLogueado()` | Si ya hay sesión, redirige desde login al index o admin |
| `verApuesta(numeroApuesta)` | Guarda en session y va a `apuesta.html?apuesta=` |
| `cerrarSesion()` | Borra `localStorage` y va al index |

## Index

| Función | Qué hace |
|---------|----------|
| `iniciarIndex()` | Carga datos, renderiza y activa polling |
| `renderizarIndex()` | Llama vigentes + cerradas + destacada |
| `cargarApuestasVigentes()` | Arma cards en `#apuestasVigentes` |
| `cargarApuestasCerradas()` | Arma cards con resultados GAN/PER |
| `cargarDestacada()` | Muestra u oculta la sección destacada |

## Login

| Función | Qué hace |
|---------|----------|
| `seleccionarPerfilRapido(btn)` | Rellena email/clave del botón de acceso rápido |
| `cargarPerfilesRapidos()` | Botones desde `obtenerUsuarios()` (JSON) |
| `iniciarLogin()` | POST login, guarda `usuarioActual` en `localStorage` |

> **Usuarios nuevos:** no hay registro web. Se agregan en `sql/sqlite_seed.sql` o con `INSERT` en la tabla `personas`.

## Detalle y apostar

| Función | Qué hace |
|---------|----------|
| `iniciarApuesta()` | Carga detalle desde JSON; si cerrada muestra resultado |
| `seleccionarPronostico(el, ocurrencia, dividendo)` | Marca opción y actualiza resumen |
| `actualizarResumen(pronostico, dividendo)` | Calcula ganancia estimada |
| `apuestaVencida(fechaLimite)` | Compara fecha de cierre con hoy |

## Admin

| Función | Qué hace |
|---------|----------|
| `iniciarAdmin()` | Protege ruta, carga tabs, polling |
| `iniciarTabsAdmin()` | Clic en pestañas con `data-tab` |
| `iniciarDelegacionAdmin()` | Clic en botones destacar/cerrar vía `data-admin-action` |
| `manejarAccionAdmin(event)` | Ejecuta destacar, quitar o abrir modal cerrar |
| `iniciarModalCerrarApuesta()` | Listeners del modal de resultado |
| `ocultarModalCerrarApuesta()` | Cierra modal y limpia selección |
| `seleccionarOcurrenciaGanadora(ocurrencia, el)` | Marca opción ganadora en el modal |
| `mostrarModalCerrarApuesta(numeroApuesta)` | Carga pronósticos y muestra modal |
| `confirmarCierreApuesta()` | PUT cerrar + recarga datos |
| `cargarApuestasAdmin()` | Grid de apuestas vigentes con acciones |
| `cargarApuestasCerradasAdmin()` | Grid cerradas con resultados |
| `cargarUsuariosAdmin()` | Tabla de usuarios desde JSON |
| `iniciarCrearApuesta()` | Formulario nueva apuesta + pronósticos dinámicos |
| `destacarApuesta(numeroApuesta)` | PUT destacar |
| `quitarDestacadaApuesta(numeroApuesta)` | PUT quitar destacada |
| `cerrarApuesta(numeroApuesta)` | Abre modal de cierre |
| `mostrarTab(tabId, tabBtn)` | Cambia pestaña visible en admin |

## Helpers

| Función | Qué hace |
|---------|----------|
| `headersAdmin()` | `{ rol: admin }` para rutas admin |
| `headersAuth()` | `{ usuario: persona }` para apostar |
| `formatearFecha(fecha)` | Fecha en formato argentino |
| `formatearMonto(monto)` | `$` con separador de miles |
| `formatearDividendo(n)` | Número con 2 decimales |
| `htmlPronosticos(lista, mostrarResultado)` | HTML de pronósticos con badges S/N |
| `htmlResultadoGanador(ganador)` | HTML del ganador de la apuesta |
| `htmlApuestasPersonas(lista)` | HTML con GAN/PER por persona |

---

## HTML — reglas importantes

- **No hay** `onclick`, `onchange` ni funciones inline en los `.html`.
- Los scripts se cargan así: primero `datos.js`, después `main.js`.
- Los botones usan `id` de DOM (ej: `btnLogin`) o atributos `data-*` (ej: `data-apuesta`, `data-tab`).

---

## Sesión en el navegador

```javascript
// Al hacer login (guarda persona, no "id")
localStorage.setItem("usuarioActual", JSON.stringify(data));

// Al ver una apuesta
sessionStorage.setItem("apuestaSeleccionada", numeroApuesta);
```

---

## Conceptos para el oral / parcial

1. **Capas:** Routes → Controllers → Models → SQLite.
2. **Lectura vs escritura:** JSON para leer; API para modificar.
3. **REST:** GET lee, POST crea, PUT actualiza; códigos 200, 201, 400, 401, 403, 404, 500.
4. **SQLite:** archivo local; `better-sqlite3`; `?` en prepared statements.
5. **Sin JOIN:** varias consultas simples + combinar en JavaScript.
6. **Parimutuel:** pozo compartido; 10% comisión; dividendo dinámico.
7. **Resultado:** admin cierra → `GAN`/`PER` en `Apuestas_personas`.
8. **`datos.json`:** espejo de la DB; campo `actualizado` para tiempo real.

---

## Mapa mental

```
HTML (solo estructura)
    ↓
datos.js (lee JSON, calcula)
main.js (eventos + escrituras API)
    ↓
server.js (API + archivos estáticos)
    ↓
controllers → models → sistema_apuestas.db
    ↓
exportarDatos → datos.json
```

---

## Usuarios de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | `admin@email.com` | `admin123` |
| Usuario | `tomas@email.com` | `user123` |
| Usuario | `fabricio@email.com` | `user123` |

---

## Cómo ejecutar

```bash
cd backend
npm install    # solo la primera vez
npm start
```

Abrir **http://localhost:3000**

Ver **`INSTRUCCIONES.md`** para problemas frecuentes y endpoints.
