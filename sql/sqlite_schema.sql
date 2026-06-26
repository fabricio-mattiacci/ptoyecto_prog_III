-- Esquema SQLite - Modelo del TP (PRG 3 - Sistema de Apuestas)

CREATE TABLE IF NOT EXISTS personas (
    persona         INTEGER PRIMARY KEY AUTOINCREMENT,
    apellido        TEXT NOT NULL,
    nombre          TEXT NOT NULL,
    dni             TEXT,
    fecha_nacimiento TEXT NOT NULL,
    mail            TEXT NOT NULL UNIQUE,
    telefono        TEXT,
    estado          TEXT NOT NULL DEFAULT 'ACT',
    clave           TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS apuestas (
    apuesta         INTEGER PRIMARY KEY AUTOINCREMENT,
    evento          TEXT NOT NULL,
    fecha_evento    TEXT NOT NULL,
    fecha_cierre    TEXT NOT NULL,
    prioridad       INTEGER NOT NULL DEFAULT 0,
    comision        INTEGER NOT NULL DEFAULT 10,
    estado          TEXT NOT NULL DEFAULT 'ACT'
);

CREATE TABLE IF NOT EXISTS Apuestas_detalle (
    apuesta         INTEGER NOT NULL,
    ocurrencia      INTEGER NOT NULL,
    descripcion     TEXT NOT NULL,
    PRIMARY KEY (apuesta, ocurrencia)
);

CREATE TABLE IF NOT EXISTS Apuestas_personas (
    apuesta         INTEGER NOT NULL,
    ocurrencia      INTEGER NOT NULL,
    persona         INTEGER NOT NULL,
    fecha           TEXT NOT NULL DEFAULT (datetime('now')),
    importe         REAL NOT NULL,
    resultado       TEXT,                            -- C(3): 'GAN' = ganó, 'PER' = perdió
    PRIMARY KEY (apuesta, ocurrencia, persona)
);
