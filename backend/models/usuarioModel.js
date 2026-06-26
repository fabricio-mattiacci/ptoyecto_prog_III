const { db } = require("../config/db");
const { sincronizarJson } = require("../utils/exportarDatos");

const SELECT_PERSONA = `
    SELECT
        persona,
        nombre,
        apellido,
        mail AS email,
        clave AS password,
        fecha_nacimiento AS fechaNacimiento,
        dni,
        telefono,
        estado,
        CASE WHEN estado = 'ADM' THEN 'admin' ELSE 'usuario' END AS rol
    FROM personas
`;

async function obtenerTodos() {
    return db.prepare(`${SELECT_PERSONA} ORDER BY nombre`).all();
}

async function obtenerPorEmail(email) {
    return db.prepare(`${SELECT_PERSONA} WHERE mail = ?`).get(email);
}

async function crear(usuario) {
    const { nombre, apellido, email, password, fechaNacimiento, dni, telefono } = usuario;
    db.prepare(`
        INSERT INTO personas (nombre, apellido, mail, clave, fecha_nacimiento, dni, telefono, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'ACT')
    `).run(nombre, apellido, email, password, fechaNacimiento, dni || null, telefono || null);
    sincronizarJson();
}

module.exports = { obtenerTodos, obtenerPorEmail, crear };
