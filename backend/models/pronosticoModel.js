const { db } = require("../config/db");
const { sincronizarJson } = require("../utils/exportarDatos");

function calcularPozoNeto(apuestaId) {
    const apuesta = db.prepare(`SELECT comision FROM apuestas WHERE apuesta = ?`).get(apuestaId);
    const pozo = db.prepare(`
        SELECT IFNULL(SUM(importe), 0) AS total
        FROM Apuestas_personas
        WHERE apuesta = ?
    `).get(apuestaId);

    const pozoBruto = pozo.total || 0;
    const comision = apuesta?.comision ?? 10;
    return pozoBruto - (pozoBruto * comision / 100);
}

async function obtenerPorApuesta(idApuesta) {
    const pozoNeto = calcularPozoNeto(idApuesta);

    const detalles = db.prepare(`
        SELECT
            d.apuesta,
            d.ocurrencia,
            d.descripcion,
            d.ocurrio,
            IFNULL(SUM(p.importe), 0) AS totalApostado
        FROM Apuestas_detalle d
        LEFT JOIN Apuestas_personas p
            ON d.apuesta = p.apuesta AND d.ocurrencia = p.ocurrencia
        WHERE d.apuesta = ?
        GROUP BY d.apuesta, d.ocurrencia, d.descripcion, d.ocurrio
        ORDER BY d.ocurrencia
    `).all(idApuesta);

    return detalles.map(function(d) {
        const totalApostado = d.totalApostado || 0;
        return {
            id: d.ocurrencia,
            idApuesta: d.apuesta,
            descripcion: d.descripcion,
            ocurrio: d.ocurrio,
            totalApostado,
            dividendo: totalApostado > 0 ? pozoNeto / totalApostado : 0
        };
    });
}

async function crear(pronostico) {
    const { idApuesta, descripcion } = pronostico;
    const siguiente = db.prepare(`
        SELECT COALESCE(MAX(ocurrencia), 0) + 1 AS n
        FROM Apuestas_detalle
        WHERE apuesta = ?
    `).get(idApuesta);

    if (siguiente.n > 10) {
        throw new Error("Máximo 10 ocurrencias por apuesta");
    }

    db.prepare(`
        INSERT INTO Apuestas_detalle (apuesta, ocurrencia, descripcion)
        VALUES (?, ?, ?)
    `).run(idApuesta, siguiente.n, descripcion);
    sincronizarJson();
}

async function actualizarDividendo() {
    sincronizarJson();
}

async function obtenerEstadoApuesta(idApuesta, ocurrencia) {
    return db.prepare(`
        SELECT
            a.estado,
            a.fecha_cierre,
            CASE WHEN date(a.fecha_cierre) < date('now') THEN 1 ELSE 0 END AS vencida
        FROM apuestas a
        JOIN Apuestas_detalle d ON d.apuesta = a.apuesta
        WHERE a.apuesta = ? AND d.ocurrencia = ?
    `).get(idApuesta, ocurrencia);
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
