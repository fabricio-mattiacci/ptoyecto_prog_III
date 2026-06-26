const apuestaModel = require("../models/apuestaModel");
const pronosticoModel = require("../models/pronosticoModel");

async function obtenerVigentes(req, res) {
    try {
        const apuestas = await apuestaModel.obtenerVigentes();
        res.json(apuestas);
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
}

async function obtenerCerradas(req, res) {
    try {
        const apuestas = await apuestaModel.obtenerCerradas();
        res.json(apuestas);
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
}

async function obtenerPorApuesta(req, res) {
    try {
        const numeroApuesta = req.params.apuesta;
        const apuesta = await apuestaModel.obtenerPorApuesta(numeroApuesta);
        if (!apuesta) {
            return res.status(404).json({ error: "Apuesta no encontrada" });
        }
        const pronosticos = await pronosticoModel.obtenerPorApuesta(numeroApuesta);
        const apuestasPersonas = await apuestaModel.obtenerApuestasPersonas(numeroApuesta);
        const pozoBruto = pronosticos.reduce((total, p) => total + (p.totalApostado || 0), 0);
        res.json({ ...apuesta, pozoBruto, pronosticos, apuestasPersonas });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
}

async function crear(req, res) {
    try {
        const { titulo, fechaEvento, fechaLimite, pronosticos } = req.body;

        if (!titulo || !fechaEvento || !fechaLimite || pronosticos.length < 2) {
            return res.status(400).json({ error: "Datos incompletos" });
        }

        const numeroApuesta = await apuestaModel.crear({ titulo, fechaEvento, fechaLimite });

        for (const descripcion of pronosticos) {
            await pronosticoModel.crear({ apuesta: numeroApuesta, descripcion });
        }

        res.status(201).json({ mensaje: "Apuesta creada correctamente" });

    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
}

async function destacar(req, res) {
    try {
        await apuestaModel.destacar(req.params.apuesta);
        res.json({ mensaje: "Apuesta destacada" });
    } catch (error) {
        if (error.code === "DESTACADA_EXISTENTE") {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Error en el servidor" });
    }
}

async function quitarDestacada(req, res) {
    try {
        await apuestaModel.quitarDestacada(req.params.apuesta);
        res.json({ mensaje: "Apuesta ya no está destacada" });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
}

async function cerrar(req, res) {
    try {
        const { ocurrenciaGanadora } = req.body;

        if (!ocurrenciaGanadora) {
            return res.status(400).json({ error: "Debés indicar la ocurrencia ganadora" });
        }

        await apuestaModel.cerrar(req.params.apuesta, ocurrenciaGanadora);
        res.json({ mensaje: "Apuesta cerrada y resultado registrado" });
    } catch (error) {
        if (error.code === "OCURRENCIA_INVALIDA") {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Error en el servidor" });
    }
}

module.exports = { obtenerVigentes, obtenerCerradas, obtenerPorApuesta, crear, destacar, quitarDestacada, cerrar };
