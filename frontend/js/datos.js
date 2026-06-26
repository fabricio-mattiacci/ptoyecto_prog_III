const DATOS_API = "http://localhost:3000/api/datos";

let cacheDatos = null;
let ultimaActualizacion = null;

function fechaHoy() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return hoy.toISOString().slice(0, 10);
}

function apuestaVencidaPorFecha(fechaCierre) {
    if (!fechaCierre) return false;
    return fechaCierre < fechaHoy();
}

function estadoApuestaDesdeJson(apuesta) {
    if (apuesta.estado === "FIN") return "cerrada";
    if (apuesta.estado === "ACT" && apuestaVencidaPorFecha(apuesta.fecha_cierre)) return "cerrada";
    if (apuesta.estado === "ACT") return "vigente";
    return apuesta.estado;
}

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

function calcularPozoBruto(datos, numeroApuesta) {
    return datos.Apuestas_personas
        .filter(function(ap) { return ap.apuesta === numeroApuesta; })
        .reduce(function(sum, ap) { return sum + (ap.importe || 0); }, 0);
}

function calcularPozoNeto(datos, numeroApuesta) {
    const apuesta = datos.apuestas.find(function(a) { return a.apuesta === numeroApuesta; });
    const pozoBruto = calcularPozoBruto(datos, numeroApuesta);
    const comision = apuesta ? apuesta.comision : 10;
    return pozoBruto - (pozoBruto * comision / 100);
}

function obtenerPronosticosDesdeJson(datos, numeroApuesta) {
    const pozoNeto = calcularPozoNeto(datos, numeroApuesta);

    return datos.Apuestas_detalle
        .filter(function(d) { return d.apuesta === numeroApuesta; })
        .sort(function(a, b) { return a.ocurrencia - b.ocurrencia; })
        .map(function(d) {
            const totalApostado = datos.Apuestas_personas
                .filter(function(ap) {
                    return ap.apuesta === numeroApuesta && ap.ocurrencia === d.ocurrencia;
                })
                .reduce(function(sum, ap) { return sum + (ap.importe || 0); }, 0);

            return {
                ocurrencia: d.ocurrencia,
                apuesta: d.apuesta,
                descripcion: d.descripcion,
                totalApostado: totalApostado,
                dividendo: totalApostado > 0 ? pozoNeto / totalApostado : 0
            };
        });
}

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

function obtenerApuestaDetalleDesdeJson(datos, numeroApuesta) {
    const codigoApuesta = Number(numeroApuesta);
    const raw = datos.apuestas.find(function(a) { return a.apuesta === codigoApuesta; });
    if (!raw) return null;

    const apuesta = mapApuesta(raw);
    const pronosticos = obtenerPronosticosDesdeJson(datos, codigoApuesta);
    const apuestasPersonas = obtenerApuestasPersonasDesdeJson(datos, codigoApuesta);
    const pozoBruto = calcularPozoBruto(datos, codigoApuesta);

    return Object.assign({}, apuesta, {
        pozoBruto: pozoBruto,
        pronosticos: pronosticos,
        apuestasPersonas: apuestasPersonas
    });
}

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
