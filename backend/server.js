/*
 * server.js — PUNTO DE ENTRADA DEL BACKEND
 * ────────────────────────────────────────
 * Arranca Express en el puerto 3000.
 * - Monta las rutas /api/* (usuarios, apuestas, pronósticos, datos).
 * - Sirve el frontend estático desde la carpeta frontend/.
 * - Al iniciar, db.js ya creó SQLite y exportó datos.json.
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const { conectar } = require("./config/db");

const usuarioRoutes = require("./routes/usuarioRoutes");
const apuestaRoutes = require("./routes/apuestaRoutes");
const pronosticoRoutes = require("./routes/pronosticoRoutes");
const datosRoutes = require("./routes/datosRoutes");

const { manejarErrores, rutaNoEncontrada } = require("./middlewares/errorMiddleware");

const app = express();
const PORT = 3000;

// Permite que el frontend (mismo u otro origen) llame a la API
app.use(cors());
// Parsea body JSON en POST/PUT
app.use(express.json());

// Log en consola de cada request (útil para depurar)
app.use(function(req, res, next) {
    console.log(`${req.method} ${req.url}`);
    next();
});

// ─── API REST ───
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/apuestas", apuestaRoutes);
app.use("/api/pronosticos", pronosticoRoutes);
app.use("/api/datos", datosRoutes);       // El frontend lee TODO desde acá

// ─── Frontend HTML/CSS/JS ───
app.use(express.static(path.join(__dirname, "..", "frontend")));

// Si no matcheó ruta ni archivo estático → 404 JSON
app.use(rutaNoEncontrada);
app.use(manejarErrores);

conectar().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
});
