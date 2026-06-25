const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
const { exportarDatos } = require("../utils/exportarDatos");

const DB_PATH = path.join(__dirname, "..", "data", "sistema_apuestas.db");
const SQL_DIR = path.join(__dirname, "..", "..", "sql");

function leerSql(archivo) {
    return fs.readFileSync(path.join(SQL_DIR, archivo), "utf8");
}

function esquemaActualizado(db) {
    try {
        const columnas = db.prepare("PRAGMA table_info(apuestas)").all();
        if (columnas.length === 0) return false;
        return columnas.some((col) => col.name === "apuesta");
    } catch {
        return false;
    }
}

function recrearBase(db) {
    db.exec(`
        DROP TABLE IF EXISTS Apuestas_personas;
        DROP TABLE IF EXISTS Apuestas_detalle;
        DROP TABLE IF EXISTS ApuestasUsuarios;
        DROP TABLE IF EXISTS ApuestaPronostico;
        DROP TABLE IF EXISTS apuestas;
        DROP TABLE IF EXISTS Apuestas;
        DROP TABLE IF EXISTS personas;
        DROP TABLE IF EXISTS Usuarios;
    `);
    db.exec(leerSql("sqlite_schema.sql"));
    db.exec(leerSql("sqlite_seed.sql"));
    migrarColumnas(db);
}

function migrarColumnas(db) {
    const columnas = db.prepare("PRAGMA table_info(Apuestas_personas)").all();
    if (columnas.length > 0 && !columnas.some((col) => col.name === "resultado")) {
        db.exec("ALTER TABLE Apuestas_personas ADD COLUMN resultado TEXT");
    }
}

function inicializarBase() {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    const db = new Database(DB_PATH);

    const tieneEsquemaNuevo = esquemaActualizado(db);
    const existeApuestasVieja = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type = 'table' AND name IN ('Apuestas', 'Usuarios', 'apuestas')
    `).all().length > 0;

    if (existeApuestasVieja && !tieneEsquemaNuevo) {
        recrearBase(db);
    } else {
        db.exec(leerSql("sqlite_schema.sql"));
        migrarColumnas(db);
        const cantidadPersonas = db.prepare("SELECT COUNT(*) AS total FROM personas").get().total;
        if (cantidadPersonas === 0) {
            db.exec(leerSql("sqlite_seed.sql"));
        }
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
