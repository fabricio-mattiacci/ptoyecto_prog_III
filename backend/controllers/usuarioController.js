const usuarioModel = require("../models/usuarioModel");

async function login(req, res) {
    try {
        const { email, password } = req.body;
        const usuario = await usuarioModel.obtenerPorEmail(email);

        if (!usuario || usuario.password !== password) {
            return res.status(401).json({ error: "Email o contraseña incorrectos" });
        }

        res.json({
            persona: usuario.persona,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            rol: usuario.rol
        });

    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
}

async function obtenerTodos(req, res) {
    try {
        const usuarios = await usuarioModel.obtenerTodos();
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
}

module.exports = { login, obtenerTodos };