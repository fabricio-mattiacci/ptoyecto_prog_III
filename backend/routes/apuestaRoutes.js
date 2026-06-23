const express = require("express");
const router = express.Router();
const apuestaController = require("../controllers/apuestaController");
const { verificarLogin, verificarAdmin } = require("../middlewares/authMiddleware");

// Rutas públicas
router.get("/vigentes", apuestaController.obtenerVigentes);
router.get("/cerradas", apuestaController.obtenerCerradas);
router.get("/finalizadas", apuestaController.obtenerCerradas);
router.get("/:id", apuestaController.obtenerPorId);

// Rutas solo para admin
router.post("/", verificarAdmin, apuestaController.crear);
router.put("/:id/destacar", verificarAdmin, apuestaController.destacar);
router.put("/:id/cerrar", verificarAdmin, apuestaController.cerrar);

module.exports = router;