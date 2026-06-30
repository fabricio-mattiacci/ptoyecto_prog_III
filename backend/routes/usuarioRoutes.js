/*
 * usuarioRoutes.js — /api/usuarios
 * POST /login  → valida mail/clave y devuelve datos del usuario
 * GET  /       → lista todos (poco usado; el admin lee del JSON)
 */

const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");

router.post("/login", usuarioController.login);
router.get("/", usuarioController.obtenerTodos);

module.exports = router;
