const usuarioModel = require("../models/usuarioModel");

async function login(req, res) {
    try {
        const { email, password } = req.body;
        const usuario = await usuarioModel.obtenerPorEmail(email);

        if (!usuario || usuario.password !== password) {
            return res.status(401).json({ error: "Email o contraseña incorrectos" });
        }

        res.json({
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            rol: usuario.rol
        });

    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
}

async function registro(req, res) {
    try {
        const { nombre, apellido, email, password, fechaNacimiento, dni, telefono } = req.body;

        // Verificar mayor de edad
        const hoy = new Date();
        const nacimiento = new Date(fechaNacimiento);
        const edad = hoy.getFullYear() - nacimiento.getFullYear();

        if (edad < 18) {
            return res.status(400).json({ error: "Debés ser mayor de 18 años" });
        }

        // Verificar si el email ya existe
        const existente = await usuarioModel.obtenerPorEmail(email);
        if (existente) {
            return res.status(400).json({ error: "El email ya está registrado" });
        }

        await usuarioModel.crear({ nombre, apellido, email, password, fechaNacimiento, dni, telefono });
        res.status(201).json({ mensaje: "Usuario registrado correctamente" });

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

module.exports = { login, registro, obtenerTodos };