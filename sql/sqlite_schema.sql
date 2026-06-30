-- ═══════════════════════════════════════════════════════════════
-- sqlite_schema.sql — MODELO DE BASE DE DATOS (4 tablas, sin FK)
-- ═══════════════════════════════════════════════════════════════
-- personas          → usuarios del sistema (ADM = admin, ACT = usuario)
-- apuestas          → eventos deportivos (ACT = abierta, FIN = cerrada)
-- Apuestas_detalle  → opciones/pronósticos de cada apuesta (ocurrencia 1, 2, …)
-- Apuestas_personas → cuánto apostó cada persona a cada opción + resultado GAN/PER

CREATE TABLE IF NOT EXISTS personas (
    persona         INTEGER PRIMARY KEY AUTOINCREMENT,  -- clave: persona (no "id")
    apellido        TEXT NOT NULL,
    nombre          TEXT NOT NULL,
    dni             TEXT,
    fecha_nacimiento TEXT NOT NULL,
    mail            TEXT NOT NULL UNIQUE,
    telefono        TEXT,
    estado          TEXT NOT NULL DEFAULT 'ACT',        -- 'ADM' o 'ACT'
    clave           TEXT NOT NULL                       -- contraseña en texto (TP)
);

CREATE TABLE IF NOT EXISTS apuestas (
    apuesta         INTEGER PRIMARY KEY AUTOINCREMENT,  -- clave: apuesta
    evento          TEXT NOT NULL,                      -- título mostrado en pantalla
    fecha_evento    TEXT NOT NULL,                      -- cuándo es el partido
    fecha_cierre    TEXT NOT NULL,                      -- último día para apostar
    prioridad       INTEGER NOT NULL DEFAULT 0,         -- >0 = apuesta destacada
    comision        INTEGER NOT NULL DEFAULT 10,        -- % que se descuenta del pozo
    estado          TEXT NOT NULL DEFAULT 'ACT'         -- 'ACT' o 'FIN'
);

CREATE TABLE IF NOT EXISTS Apuestas_detalle (
    apuesta         INTEGER NOT NULL,
    ocurrencia      INTEGER NOT NULL,                   -- número de opción (1, 2, 3…)
    descripcion     TEXT NOT NULL,                        -- ej: "Argentina", "Alemania"
    PRIMARY KEY (apuesta, ocurrencia)
);

CREATE TABLE IF NOT EXISTS Apuestas_personas (
    apuesta         INTEGER NOT NULL,
    ocurrencia      INTEGER NOT NULL,
    persona         INTEGER NOT NULL,
    fecha           TEXT NOT NULL DEFAULT (datetime('now')),
    importe         REAL NOT NULL,                      -- monto apostado ($)
    resultado       TEXT,                               -- 'GAN' o 'PER' al cerrar (null antes)
    PRIMARY KEY (apuesta, ocurrencia, persona)
);
