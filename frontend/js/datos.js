/*
 * datos.js — CAPA DE LECTURA (solo lee datos.json)
 * ───────────────────────────────────────────────
 * El frontend NO consulta listas por API GET de apuestas/usuarios.
 * Todo se lee desde GET /api/datos → backend/data/datos.json
 *
 * Ese JSON se sincroniza con SQLite cada vez que hay un cambio (apostar, crear, cerrar).
 * Los pozos y dividendos ya vienen calculados con SUM en el servidor.
 */

const DATOS_API = "http://localhost:3000/api/datos";

// Caché en memoria para no pedir el JSON en cada función
let cacheDatos = null;
let ultimaActualizacion = null;

/* ─── FECHAS Y ESTADO DE APUESTAS ─── */

/** Fecha de hoy en formato YYYY-MM-DD (para comparar con fecha_cierre). */
function fechaHoy() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return hoy.toISOString().slice(0, 10);
}

/** true si la fecha de cierre ya pasó (la apuesta deja de aceptar apuestas). */
function apuestaVencidaPorFecha(fechaCierre) {
    if (!fechaCierre) return false;
    return fechaCierre < fechaHoy();
}

/** Convierte estado de la DB (ACT/FIN) + fecha → 'vigente' o 'cerrada' para la UI. */
function estadoApuestaDesdeJson(apuesta) {
    if (apuesta.estado === "FIN") return "cerrada";
    if (apuesta.estado === "ACT" && apuestaVencidaPorFecha(apuesta.fecha_cierre)) return "cerrada";
    if (apuesta.estado === "ACT") return "vigente";
    return apuesta.estado;
}

/** Mapea una fila de `apuestas` del JSON a nombres amigables para main.js. */
function mapApuesta(apuesta) {
    return {
        apuesta: apuesta.apuesta,
        titulo: apuesta.evento,
        fechaEvento: apuesta.fecha_evento,
        fechaLimite: apuesta.fecha_cierre,
        prioridad: apuesta.prioridad,
        comision: apuesta.comision,
        estadoDb: apuesta.estado,
        estado: estadoApuestaDesdeJson(apuesta),
        destacada: apuesta.prioridad > 0
    };
}

/* ─── ARMAR OBJETOS DESDE EL JSON ─── */

/** Opciones de una apuesta: descripción, total apostado y dividendo (ya vienen del export). */
function obtenerPronosticosDesdeJson(datos, numeroApuesta) {
    return datos.Apuestas_detalle
        .filter(function(d) { return d.apuesta === numeroApuesta; })
        .sort(function(a, b) { return a.ocurrencia - b.ocurrencia; })
        .map(function(d) {
            return {
                ocurrencia: d.ocurrencia,
                apuesta: d.apuesta,
                descripcion: d.descripcion,
                totalApostado: d.totalApostado || 0,
                dividendo: d.dividendo || 0
            };
        });
}

/** Apuestas de personas en una apuesta: combina JSON de tablas sin JOIN (en JS). */
function obtenerApuestasPersonasDesdeJson(datos, numeroApuesta) {
    return datos.Apuestas_personas
        .filter(function(ap) { return ap.apuesta === numeroApuesta; })
        .map(function(ap) {
            const persona = datos.personas.find(function(p) { return p.persona === ap.persona; });
            const detalle = datos.Apuestas_detalle.find(function(d) {
                return d.apuesta === ap.apuesta && d.ocurrencia === ap.ocurrencia;
            });

            return {
                ocurrencia: ap.ocurrencia,
                persona: ap.persona,
                importe: ap.importe,
                fecha: ap.fecha,
                resultado: ap.resultado,
                nombre: persona ? persona.nombre : "",
                apellido: persona ? persona.apellido : "",
                email: persona ? persona.mail : "",
                descripcion: detalle ? detalle.descripcion : ""
            };
        })
        .sort(function(a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
}

/** Apuesta completa para apuesta.html: cabecera + pronósticos + quién apostó. */
function obtenerApuestaDetalleDesdeJson(datos, numeroApuesta) {
    const codigoApuesta = Number(numeroApuesta);
    const raw = datos.apuestas.find(function(a) { return a.apuesta === codigoApuesta; });
    if (!raw) return null;

    const apuesta = mapApuesta(raw);
    const pronosticos = obtenerPronosticosDesdeJson(datos, codigoApuesta);
    const apuestasPersonas = obtenerApuestasPersonasDesdeJson(datos, codigoApuesta);
    const pozoBruto = raw.pozoBruto || 0;

    return Object.assign({}, apuesta, {
        pozoBruto: pozoBruto,
        pronosticos: pronosticos,
        apuestasPersonas: apuestasPersonas
    });
}

/** Lista usuarios para login (compara clave en main.js) y tabla admin. */
function obtenerUsuariosDesdeJson(datos) {
    return datos.personas.map(function(p) {
        return {
            persona: p.persona,
            nombre: p.nombre,
            apellido: p.apellido,
            email: p.mail,
            password: p.clave,
            fechaNacimiento: p.fecha_nacimiento,
            dni: p.dni,
            telefono: p.telefono,
            rol: p.estado === "ADM" ? "admin" : "usuario"
        };
    });
}

/** Apuestas ACT con fecha de cierre >= hoy. */
function obtenerApuestasVigentesDesdeJson(datos) {
    return datos.apuestas
        .filter(function(a) {
            return a.estado === "ACT" && !apuestaVencidaPorFecha(a.fecha_cierre);
        })
        .map(mapApuesta)
        .sort(function(a, b) {
            return String(a.fechaLimite).localeCompare(String(b.fechaLimite));
        });
}

/** Apuestas FIN o ACT pero con fecha de cierre ya pasada. */
function obtenerApuestasCerradasDesdeJson(datos) {
    return datos.apuestas
        .filter(function(a) {
            return a.estado === "FIN" || (a.estado === "ACT" && apuestaVencidaPorFecha(a.fecha_cierre));
        })
        .map(mapApuesta)
        .sort(function(a, b) {
            return String(b.fechaEvento).localeCompare(String(a.fechaEvento));
        });
}

/* ─── CARGA Y POLLING ─── */

/** Descarga datos.json del servidor y guarda en caché. */
async function cargarDatos() {
    const res = await fetch(`${DATOS_API}?t=${Date.now()}`);
    if (!res.ok) {
        throw new Error("No se pudo cargar datos.json");
    }
    const datos = await res.json();
    cacheDatos = datos;
    ultimaActualizacion = datos.actualizado;
    return datos;
}

function getDatosCache() {
    return cacheDatos;
}

function getUltimaActualizacion() {
    return ultimaActualizacion;
}

async function obtenerApuestasVigentes() {
    const datos = cacheDatos || await cargarDatos();
    return obtenerApuestasVigentesDesdeJson(datos);
}

async function obtenerApuestasCerradas() {
    const datos = cacheDatos || await cargarDatos();
    return obtenerApuestasCerradasDesdeJson(datos);
}

async function obtenerApuestaPorNumero(numeroApuesta) {
    const datos = cacheDatos || await cargarDatos();
    return obtenerApuestaDetalleDesdeJson(datos, numeroApuesta);
}

async function obtenerUsuarios() {
    const datos = cacheDatos || await cargarDatos();
    return obtenerUsuariosDesdeJson(datos);
}

/**
 * Cada X ms vuelve a pedir el JSON; si cambió `actualizado`, ejecuta callback.
 * Usado en index y admin para ver pozos/dividendos en tiempo casi real.
 */
function iniciarPollingDatos(callback, intervaloMs) {
    const cada = intervaloMs || 3000;
    return setInterval(async function() {
        try {
            const anterior = ultimaActualizacion;
            await cargarDatos();
            if (ultimaActualizacion !== anterior) {
                await callback();
            }
        } catch (error) {
            console.error("Error actualizando datos.json:", error);
        }
    }, cada);
}
