const pronosticoModel = require("../models/pronosticoModel");

async function apostar(req, res) {
    try {
        const { idUsuario, idPronostico, idApuesta, monto } = req.body;

        if (!idUsuario || !idPronostico || !idApuesta || !monto) {
            return res.status(400).json({ error: "Datos incompletos" });
        }

        if (monto <= 0 || monto > 100000) {
            return res.status(400).json({ error: "Monto inválido" });
        }

        const apuesta = await pronosticoModel.obtenerEstadoApuesta(idApuesta, idPronostico);
        if (!apuesta || apuesta.estado !== "ACT" || apuesta.vencida) {
            return res.status(400).json({ error: "Esta apuesta ya está cerrada o venció el plazo" });
        }

        await pronosticoModel.apostar(idApuesta, idPronostico, idUsuario, monto);
        await pronosticoModel.actualizarDividendo();

        res.status(201).json({ mensaje: "Apuesta realizada correctamente" });

    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
}

module.exports = { apostar };
