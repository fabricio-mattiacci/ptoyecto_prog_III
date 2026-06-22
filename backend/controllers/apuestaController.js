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

async function obtenerFinalizadas(req, res) {
    try {
        const apuestas = await apuestaModel.obtenerFinalizadas();
        res.json(apuestas);
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
}

async function obtenerPorId(req, res) {
    try {
        const apuesta = await apuestaModel.obtenerPorId(req.params.id);
        if (!apuesta) {
            return res.status(404).json({ error: "Apuesta no encontrada" });
        }
        const pronosticos = await pronosticoModel.obtenerPorApuesta(req.params.id);
        res.json({ ...apuesta, pronosticos });
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

        const idApuesta = await apuestaModel.crear({ titulo, fechaEvento, fechaLimite });

        for (const descripcion of pronosticos) {
            await pronosticoModel.crear({ idApuesta, descripcion });
        }

        res.status(201).json({ mensaje: "Apuesta creada correctamente" });

    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
}

async function destacar(req, res) {
    try {
        await apuestaModel.destacar(req.params.id);
        res.json({ mensaje: "Apuesta destacada" });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
}

async function cerrar(req, res) {
    try {
        await apuestaModel.cerrar(req.params.id);
        res.json({ mensaje: "Apuesta cerrada" });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
}

async function aprobar(req, res) {
    try {
        await apuestaModel.aprobar(req.params.id);
        res.json({ mensaje: "Apuesta aprobada" });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
}

module.exports = { obtenerVigentes, obtenerFinalizadas, obtenerPorId, crear, destacar, cerrar, aprobar };