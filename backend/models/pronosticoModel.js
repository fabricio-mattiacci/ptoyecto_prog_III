const { db } = require("../config/db");
const { sincronizarJson } = require("../utils/exportarDatos");
const { obtenerPronosticosConTotales } = require("../utils/calcularTotales");

async function obtenerPorApuesta(idApuesta) {
    return obtenerPronosticosConTotales(db, idApuesta);
}

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

async function actualizarDividendo() {
    sincronizarJson();
}

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
