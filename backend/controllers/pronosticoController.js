/*
 * pronosticoController.js — Registrar una apuesta de un usuario
 * Valida monto, que la apuesta esté ACT y no vencida, luego INSERT en Apuestas_personas.
 */

const pronosticoModel = require("../models/pronosticoModel");

/** POST body: { persona, ocurrencia, apuesta, monto } */
async function apostar(req, res) {
    try {
        const { persona, ocurrencia, apuesta, monto } = req.body;

        if (!persona || !ocurrencia || !apuesta || !monto) {
            return res.status(400).json({ error: "Datos incompletos" });
        }

        if (monto <= 0 || monto > 100000) {
            return res.status(400).json({ error: "Monto inválido" });
        }

        const estadoApuesta = await pronosticoModel.obtenerEstadoApuesta(apuesta, ocurrencia);
        if (!estadoApuesta || estadoApuesta.estado !== "ACT" || estadoApuesta.vencida) {
            return res.status(400).json({ error: "Esta apuesta ya está cerrada o venció el plazo" });
        }

        await pronosticoModel.apostar(apuesta, ocurrencia, persona, monto);
        await pronosticoModel.actualizarDividendo();

        res.status(201).json({ mensaje: "Apuesta realizada correctamente" });

    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
}

module.exports = { apostar };
