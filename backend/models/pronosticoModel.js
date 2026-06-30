/*
 * pronosticoModel.js — Tablas Apuestas_detalle y Apuestas_personas
 * - crear: nueva opción (ocurrencia) con MAX(ocurrencia)+1
 * - apostar: INSERT o suma importe si la persona ya apostó esa opción
 * - obtenerPorApuesta: totales vía calcularTotales.js
 */

const { db } = require("../config/db");
const { sincronizarJson } = require("../utils/exportarDatos");
const { obtenerPronosticosConTotales } = require("../utils/calcularTotales");

async function obtenerPorApuesta(idApuesta) {
    return obtenerPronosticosConTotales(db, idApuesta);
}

/** Agrega una fila en Apuestas_detalle (máximo 10 opciones por apuesta). */
async function crear(pronostico) {
    const { apuesta, descripcion } = pronostico;
    const siguiente = db.prepare(`
        SELECT COALESCE(MAX(ocurrencia), 0) + 1 AS n
        FROM Apuestas_detalle
        WHERE apuesta = ?
    `).get(apuesta);

    if (siguiente.n > 10) {
        throw new Error("Máximo 10 ocurrencias por apuesta");
    }

    db.prepare(`
        INSERT INTO Apuestas_detalle (apuesta, ocurrencia, descripcion)
        VALUES (?, ?, ?)
    `).run(apuesta, siguiente.n, descripcion);
    sincronizarJson();
}

/** Tras apostar, recalcula y reescribe datos.json */
async function actualizarDividendo() {
    sincronizarJson();
}

/** Comprueba si la apuesta acepta apuestas (ACT y fecha_cierre >= hoy). */
async function obtenerEstadoApuesta(idApuesta, ocurrencia) {
    const apuesta = db.prepare(`
        SELECT estado, fecha_cierre
        FROM apuestas
        WHERE apuesta = ?
    `).get(idApuesta);

    const detalle = db.prepare(`
        SELECT ocurrencia
        FROM Apuestas_detalle
        WHERE apuesta = ? AND ocurrencia = ?
    `).get(idApuesta, ocurrencia);

    if (!apuesta || !detalle) {
        return null;
    }

    const vencida = db.prepare(`
        SELECT CASE WHEN date(?) < date('now') THEN 1 ELSE 0 END AS vencida
    `).get(apuesta.fecha_cierre);

    return {
        estado: apuesta.estado,
        fecha_cierre: apuesta.fecha_cierre,
        vencida: vencida.vencida
    };
}

/** Guarda cuánto apostó una persona a una ocurrencia (puede sumar si repite). */
async function apostar(idApuesta, ocurrencia, persona, importe) {
    db.prepare(`
        INSERT INTO Apuestas_personas (apuesta, ocurrencia, persona, importe, fecha)
        VALUES (?, ?, ?, ?, datetime('now'))
        ON CONFLICT(apuesta, ocurrencia, persona) DO UPDATE SET
            importe = importe + excluded.importe,
            fecha = datetime('now')
    `).run(idApuesta, ocurrencia, persona, importe);
    sincronizarJson();
}

module.exports = { obtenerPorApuesta, crear, actualizarDividendo, apostar, obtenerEstadoApuesta };
