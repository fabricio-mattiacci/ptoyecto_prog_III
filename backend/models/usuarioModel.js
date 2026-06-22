const { sql } = require("../config/db");

async function obtenerTodos() {
    const resultado = await sql.query("SELECT * FROM Usuarios");
    return resultado.recordset;
}

async function obtenerPorEmail(email) {
    const resultado = await sql.query(`
        SELECT * FROM Usuarios WHERE email = '${email}'
    `);
    return resultado.recordset[0];
}

async function crear(usuario) {
    const { nombre, apellido, email, password, fechaNacimiento, dni, telefono } = usuario;
    await sql.query(`
        INSERT INTO Usuarios (nombre, apellido, email, password, fechaNacimiento, dni, telefono)
        VALUES ('${nombre}', '${apellido}', '${email}', '${password}', 
                '${fechaNacimiento}', '${dni}', '${telefono}')
    `);
}

module.exports = { obtenerTodos, obtenerPorEmail, crear };