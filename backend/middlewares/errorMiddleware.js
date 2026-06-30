/*
 * errorMiddleware.js — Respuestas de error globales
 * rutaNoEncontrada → 404 si la URL no existe
 * manejarErrores   → 500 ante excepciones no capturadas
 */

function manejarErrores(err, req, res, next) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
}

function rutaNoEncontrada(req, res) {
    res.status(404).json({ error: "Ruta no encontrada" });
}

module.exports = { manejarErrores, rutaNoEncontrada };
