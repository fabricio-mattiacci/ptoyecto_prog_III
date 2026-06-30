/*
 * authMiddleware.js — “Autenticación” por headers HTTP
 * ────────────────────────────────────────────────────
 * No hay JWT ni sesión en servidor. El frontend envía:
 * - header "usuario" → persona (número) para apostar
 * - header "rol" → "admin" para rutas de administración
 */

/** Requiere header usuario (POST apostar). */
function verificarLogin(req, res, next) {
    const usuario = req.headers["usuario"];

    if (!usuario) {
        return res.status(401).json({ error: "No autorizado — debés iniciar sesión" });
    }

    next();
}

/** Requiere header rol = admin (crear/cerrar/destacar apuestas). */
function verificarAdmin(req, res, next) {
    const rol = req.headers["rol"];

    if (rol !== "admin") {
        return res.status(403).json({ error: "Acceso denegado — solo administradores" });
    }

    next();
}

module.exports = { verificarLogin, verificarAdmin };
