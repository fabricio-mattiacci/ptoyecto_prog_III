const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");

router.post("/login", usuarioController.login);
router.post("/registro", usuarioController.registro);
router.get("/", usuarioController.obtenerTodos);

module.exports = router;