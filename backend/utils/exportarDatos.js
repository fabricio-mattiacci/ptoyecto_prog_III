/*
 * exportarDatos.js — SINCRONIZA SQLite → datos.json
 * ─────────────────────────────────────────────────
 * Después de cada INSERT/UPDATE (apostar, crear, cerrar, etc.)
 * los models llaman sincronizarJson().
 *
 * El JSON incluye las 4 tablas + campos calculados:
 * - apuestas: pozoBruto, pozoNeto
 * - Apuestas_detalle: totalApostado, dividendo
 * - actualizado: timestamp para que el frontend detecte cambios
 */

const fs = require("fs");
const path = require("path");
const {
    calcularPozoBruto,
    calcularPozoNeto,
    sumarImporteOcurrencia
} = require("./calcularTotales");

const JSON_PATH = path.join(__dirname, "..", "data", "datos.json");

function exportarDatos(db) {
    const dataDir = path.dirname(JSON_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    const apuestasRaw = db.prepare(`
        SELECT apuesta, evento, fecha_evento, fecha_cierre, prioridad, comision, estado
        FROM apuestas
        ORDER BY apuesta
    `).all();

    const apuestas = apuestasRaw.map(function(a) {
        const pozoBruto = calcularPozoBruto(db, a.apuesta);
        return Object.assign({}, a, {
            pozoBruto: pozoBruto,
            pozoNeto: calcularPozoNeto(db, a.apuesta)
        });
    });

    const detalleRaw = db.prepare(`
        SELECT apuesta, ocurrencia, descripcion
        FROM Apuestas_detalle
        ORDER BY apuesta, ocurrencia
    `).all();

    const Apuestas_detalle = detalleRaw.map(function(d) {
        const pozoNeto = calcularPozoNeto(db, d.apuesta);
        const totalApostado = sumarImporteOcurrencia(db, d.apuesta, d.ocurrencia);
        return Object.assign({}, d, {
            totalApostado: totalApostado,
            dividendo: totalApostado > 0 ? pozoNeto / totalApostado : 0
        });
    });

    const datos = {
        actualizado: new Date().toISOString(),
        personas: db.prepare(`
            SELECT persona, apellido, nombre, dni, fecha_nacimiento, mail, telefono, estado, clave
            FROM personas
            ORDER BY persona
        `).all(),
        apuestas: apuestas,
        Apuestas_detalle: Apuestas_detalle,
        Apuestas_personas: db.prepare(`
            SELECT apuesta, ocurrencia, persona, fecha, importe, resultado
            FROM Apuestas_personas
            ORDER BY apuesta, ocurrencia, persona
        `).all()
    };

    fs.writeFileSync(JSON_PATH, JSON.stringify(datos, null, 2), "utf8");
}

function sincronizarJson() {
    const { db } = require("../config/db");
    exportarDatos(db);
}

module.exports = { exportarDatos, sincronizarJson };
