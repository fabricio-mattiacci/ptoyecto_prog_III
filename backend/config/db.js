/*
 * db.js — CONEXIÓN E INICIALIZACIÓN DE SQLITE
 * ───────────────────────────────────────────
 * Al cargar este módulo:
 * 1. Abre (o crea) backend/data/sistema_apuestas.db
 * 2. Ejecuta sql/sqlite_schema.sql (CREATE TABLE IF NOT EXISTS)
 * 3. Si no hay personas, ejecuta sql/sqlite_seed.sql (datos de prueba)
 * 4. Exporta datos.json por primera vez
 *
 * Exporta: { db, conectar } — el resto del backend usa db.prepare(...)
 */

const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
const { exportarDatos } = require("../utils/exportarDatos");

const DB_PATH = path.join(__dirname, "..", "data", "sistema_apuestas.db");
const SQL_DIR = path.join(__dirname, "..", "..", "sql");

/** Lee un archivo .sql de la carpeta sql/ */
function leerSql(archivo) {
    return fs.readFileSync(path.join(SQL_DIR, archivo), "utf8");
}

/** Crea carpeta data/, abre DB, schema y seed si hace falta */
function inicializarBase() {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    const db = new Database(DB_PATH);

    db.exec(leerSql("sqlite_schema.sql"));

    const cantidadPersonas = db.prepare("SELECT COUNT(*) AS total FROM personas").get().total;
    if (cantidadPersonas === 0) {
        db.exec(leerSql("sqlite_seed.sql"));
    }

    return db;
}

const db = inicializarBase();
exportarDatos(db);

function conectar() {
    console.log("Conectado a SQLite:", DB_PATH);
    return Promise.resolve();
}

module.exports = { db, conectar };
