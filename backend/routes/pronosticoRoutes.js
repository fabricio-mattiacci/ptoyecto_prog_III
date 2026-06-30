/*
 * pronosticoRoutes.js — /api/pronosticos
 * POST /apostar — usuario logueado apuesta monto en una ocurrencia
 * (header usuario = número de persona)
 */

const express = require("express");
const router = express.Router();
const pronosticoController = require("../controllers/pronosticoController");
const { verificarLogin } = require("../middlewares/authMiddleware");

router.post("/apostar", verificarLogin, pronosticoController.apostar);

module.exports = router;
