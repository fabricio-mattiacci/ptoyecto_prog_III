function verificarLogin(req, res, next) {
    const usuario = req.headers["usuario"];

    if (!usuario) {
        return res.status(401).json({ error: "No autorizado — debés iniciar sesión" });
    }

    next();
}

function verificarAdmin(req, res, next) {
    const rol = req.headers["rol"];

    if (rol !== "admin") {
        return res.status(403).json({ error: "Acceso denegado — solo administradores" });
    }

    next();
}

module.exports = { verificarLogin, verificarAdmin };