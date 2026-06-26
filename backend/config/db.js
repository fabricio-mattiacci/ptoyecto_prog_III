const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
const { exportarDatos } = require("../utils/exportarDatos");

const DB_PATH = path.join(__dirname, "..", "data", "sistema_apuestas.db");
const SQL_DIR = path.join(__dirname, "..", "..", "sql");

function leerSql(archivo) {
    return fs.readFileSync(path.join(SQL_DIR, archivo), "utf8");
}

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
