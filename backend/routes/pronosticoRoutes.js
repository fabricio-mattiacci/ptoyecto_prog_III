const express = require("express");
const router = express.Router();
const pronosticoController = require("../controllers/pronosticoController");
const { verificarLogin } = require("../middlewares/authMiddleware");

// Solo usuarios logueados pueden apostar
router.post("/apostar", verificarLogin, pronosticoController.apostar);

module.exports = router;