const pronosticoModel = require("../models/pronosticoModel");

async function apostar(req, res) {
    try {
        const { idUsuario, idPronostico, monto } = req.body;

        if (!idUsuario || !idPronostico || !monto) {
            return res.status(400).json({ error: "Datos incompletos" });
        }

        if (monto <= 0 || monto > 100000) {
            return res.status(400).json({ error: "Monto inválido" });
        }

        await pronosticoModel.apostar(idUsuario, idPronostico, monto);
        await pronosticoModel.actualizarDividendo(req.body.idApuesta);

        res.status(201).json({ mensaje: "Apuesta realizada correctamente" });

    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
}

module.exports = { apostar };