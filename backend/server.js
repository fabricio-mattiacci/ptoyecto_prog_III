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

// Middlewares globales
app.use(cors());
app.use(express.json());

// Middleware de log — registra cada request
app.use(function(req, res, next) {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Rutas
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/apuestas", apuestaRoutes);
app.use("/api/pronosticos", pronosticoRoutes);
app.use("/api/datos", datosRoutes);

// Frontend estático (abrir http://localhost:3000)
app.use(express.static(path.join(__dirname, "..", "frontend")));

// Middlewares de error — siempre al final
app.use(rutaNoEncontrada);
app.use(manejarErrores);

// Iniciar servidor
conectar().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
});