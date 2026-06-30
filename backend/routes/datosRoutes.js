/*
 * datosRoutes.js — GET /api/datos
 * Devuelve el archivo datos.json (espejo de la base con totales calculados).
 * Es la única ruta que usa el frontend para LEER listas y detalles.
 */

const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const JSON_PATH = path.join(__dirname, "..", "data", "datos.json");

router.get("/", function(req, res) {
    try {
        if (!fs.existsSync(JSON_PATH)) {
            return res.status(404).json({ error: "datos.json no encontrado" });
        }
        const contenido = fs.readFileSync(JSON_PATH, "utf8");
        res.type("application/json").send(contenido);
    } catch (error) {
        res.status(500).json({ error: "Error al leer datos.json" });
    }
});

module.exports = router;
