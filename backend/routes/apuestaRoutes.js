/*
 * apuestaRoutes.js — /api/apuestas
 * GET  vigentes, cerradas, /:apuesta — consultas (el front casi no las usa; lee JSON)
 * POST / — crear apuesta (solo admin, header rol: admin)
 * PUT  /:apuesta/destacar | quitar-destacada | cerrar — acciones admin
 */

const express = require("express");
const router = express.Router();
const apuestaController = require("../controllers/apuestaController");
const { verificarLogin, verificarAdmin } = require("../middlewares/authMiddleware");

router.get("/vigentes", apuestaController.obtenerVigentes);
router.get("/cerradas", apuestaController.obtenerCerradas);
router.get("/finalizadas", apuestaController.obtenerCerradas);
router.get("/:apuesta", apuestaController.obtenerPorApuesta);

router.post("/", verificarAdmin, apuestaController.crear);
router.put("/:apuesta/destacar", verificarAdmin, apuestaController.destacar);
router.put("/:apuesta/quitar-destacada", verificarAdmin, apuestaController.quitarDestacada);
router.put("/:apuesta/cerrar", verificarAdmin, apuestaController.cerrar);

module.exports = router;
