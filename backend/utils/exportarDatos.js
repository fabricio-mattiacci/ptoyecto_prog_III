const fs = require("fs");
const path = require("path");

const JSON_PATH = path.join(__dirname, "..", "data", "datos.json");

function exportarDatos(db) {
    const dataDir = path.dirname(JSON_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    const datos = {
        actualizado: new Date().toISOString(),
        personas: db.prepare(`
            SELECT persona, apellido, nombre, dni, fecha_nacimiento, mail, telefono, estado, clave
            FROM personas
            ORDER BY persona
        `).all(),
        apuestas: db.prepare(`
            SELECT apuesta, evento, fecha_evento, fecha_cierre, prioridad, comision, estado
            FROM apuestas
            ORDER BY apuesta
        `).all(),
        Apuestas_detalle: db.prepare(`
            SELECT apuesta, ocurrencia, descripcion
            FROM Apuestas_detalle
            ORDER BY apuesta, ocurrencia
        `).all(),
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
