/*
 * apuestaModel.js — Tabla apuestas + consultas relacionadas
 * Calcula estado vigente/cerrada en SQL con CASE y fechas.
 * cerrar: pone FIN y asigna GAN/PER en Apuestas_personas según ocurrencia ganadora.
 * obtenerApuestasPersonas: sin JOIN — consultas WHERE separadas a personas y detalle.
 */

const { db } = require("../config/db");
const { sincronizarJson } = require("../utils/exportarDatos");

const SELECT_APUESTA = `
    SELECT
        apuesta,
        evento AS titulo,
        fecha_evento AS fechaEvento,
        fecha_cierre AS fechaLimite,
        prioridad,
        comision,
        estado AS estadoDb,
        CASE
            WHEN estado = 'FIN' THEN 'cerrada'
            WHEN estado = 'ACT' AND date(fecha_cierre) < date('now') THEN 'cerrada'
            WHEN estado = 'ACT' THEN 'vigente'
            ELSE estado
        END AS estado,
        CASE WHEN prioridad > 0 THEN 1 ELSE 0 END AS destacada
    FROM apuestas
`;

const FILTRO_VIGENTE = `
    estado = 'ACT' AND date(fecha_cierre) >= date('now')
`;

async function obtenerTodas() {
    return db.prepare(`${SELECT_APUESTA} ORDER BY fecha_cierre ASC`).all();
}

async function obtenerVigentes() {
    return db.prepare(`${SELECT_APUESTA} WHERE ${FILTRO_VIGENTE} ORDER BY fecha_cierre ASC`).all();
}

async function obtenerCerradas() {
    return db.prepare(`
        ${SELECT_APUESTA}
        WHERE estado = 'FIN' OR (estado = 'ACT' AND date(fecha_cierre) < date('now'))
        ORDER BY fecha_evento DESC
    `).all();
}

async function obtenerPorApuesta(apuesta) {
    return db.prepare(`${SELECT_APUESTA} WHERE apuesta = ?`).get(apuesta);
}

async function crear(apuesta) {
    const { titulo, fechaEvento, fechaLimite } = apuesta;
    const resultado = db.prepare(`
        INSERT INTO apuestas (evento, fecha_evento, fecha_cierre, estado, comision)
        VALUES (?, ?, ?, 'ACT', 10)
    `).run(titulo, fechaEvento, fechaLimite);
    sincronizarJson();
    return resultado.lastInsertRowid;
}

async function obtenerDestacadaVigente() {
    return db.prepare(`
        ${SELECT_APUESTA}
        WHERE ${FILTRO_VIGENTE} AND prioridad > 0
        LIMIT 1
    `).get();
}

/** Solo una apuesta destacada a la vez entre las vigentes */
async function destacar(id) {
    const otraDestacada = db.prepare(`
        SELECT apuesta FROM apuestas
        WHERE ${FILTRO_VIGENTE} AND prioridad > 0 AND apuesta != ?
        LIMIT 1
    `).get(id);

    if (otraDestacada) {
        const error = new Error("Ya hay una apuesta destacada. Quitá la destacada actual primero.");
        error.code = "DESTACADA_EXISTENTE";
        throw error;
    }

    db.prepare(`
        UPDATE apuestas SET prioridad = 1 WHERE apuesta = ?
    `).run(id);
    sincronizarJson();
}

async function quitarDestacada(id) {
    db.prepare(`
        UPDATE apuestas SET prioridad = 0 WHERE apuesta = ?
    `).run(id);
    sincronizarJson();
}

/** Admin define ganador: FIN + resultado GAN en ganadores, PER en el resto */
async function cerrar(id, ocurrenciaGanadora) {
    const detalle = db.prepare(`
        SELECT ocurrencia FROM Apuestas_detalle
        WHERE apuesta = ? AND ocurrencia = ?
    `).get(id, ocurrenciaGanadora);

    if (!detalle) {
        const error = new Error("La ocurrencia ganadora no existe en esta apuesta");
        error.code = "OCURRENCIA_INVALIDA";
        throw error;
    }

    db.prepare(`UPDATE apuestas SET estado = 'FIN' WHERE apuesta = ?`).run(id);

    db.prepare(`
        UPDATE Apuestas_personas
        SET resultado = CASE WHEN ocurrencia = ? THEN 'GAN' ELSE 'PER' END
        WHERE apuesta = ?
    `).run(ocurrenciaGanadora, id);

    sincronizarJson();
}

/** Filas de quién apostó; enriquece con nombre y descripción sin JOIN */
async function obtenerApuestasPersonas(id) {
    const filas = db.prepare(`
        SELECT ocurrencia, persona, importe, fecha, resultado
        FROM Apuestas_personas
        WHERE apuesta = ?
        ORDER BY fecha DESC
    `).all(id);

    const buscarPersona = db.prepare(`
        SELECT nombre, apellido, mail
        FROM personas
        WHERE persona = ?
    `);

    const buscarDetalle = db.prepare(`
        SELECT descripcion
        FROM Apuestas_detalle
        WHERE apuesta = ? AND ocurrencia = ?
    `);

    return filas.map(function(ap) {
        const persona = buscarPersona.get(ap.persona);
        const detalle = buscarDetalle.get(id, ap.ocurrencia);

        return {
            ocurrencia: ap.ocurrencia,
            persona: ap.persona,
            importe: ap.importe,
            fecha: ap.fecha,
            resultado: ap.resultado,
            nombre: persona ? persona.nombre : null,
            apellido: persona ? persona.apellido : null,
            email: persona ? persona.mail : null,
            descripcion: detalle ? detalle.descripcion : null
        };
    });
}

module.exports = {
    obtenerTodas, obtenerVigentes, obtenerCerradas, obtenerPorApuesta,
    obtenerDestacadaVigente, crear, destacar, quitarDestacada, cerrar, obtenerApuestasPersonas
};
