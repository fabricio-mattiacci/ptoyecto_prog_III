const { db } = require("../config/db");
const { sincronizarJson } = require("../utils/exportarDatos");

const SELECT_APUESTA = `
    SELECT
        apuesta AS id,
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

async function obtenerPorId(id) {
    return db.prepare(`${SELECT_APUESTA} WHERE apuesta = ?`).get(id);
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

async function cerrar(id) {
    db.prepare(`
        UPDATE apuestas SET estado = 'FIN' WHERE apuesta = ?
    `).run(id);
    sincronizarJson();
}

module.exports = {
    obtenerTodas, obtenerVigentes, obtenerCerradas, obtenerPorId,
    obtenerDestacadaVigente, crear, destacar, quitarDestacada, cerrar
};
