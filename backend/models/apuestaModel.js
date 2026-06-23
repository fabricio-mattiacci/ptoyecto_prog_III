const { sql } = require("../config/db");

async function obtenerTodas() {
    const resultado = await sql.query(`
        SELECT * FROM Apuestas ORDER BY fechaLimite ASC
    `);
    return resultado.recordset;
}

async function obtenerVigentes() {
    const resultado = await sql.query(`
        SELECT * FROM Apuestas 
        WHERE estado = 'vigente' 
        ORDER BY fechaLimite ASC
    `);
    return resultado.recordset;
}

async function obtenerCerradas() {
    const resultado = await sql.query(`
        SELECT * FROM Apuestas 
        WHERE estado = 'cerrada'
        ORDER BY fechaEvento DESC
    `);
    return resultado.recordset;
}

async function obtenerPorId(id) {
    const resultado = await sql.query(`
        SELECT * FROM Apuestas WHERE id = ${id}
    `);
    return resultado.recordset[0];
}

async function crear(apuesta) {
    const { titulo, fechaEvento, fechaLimite } = apuesta;
    const resultado = await sql.query(`
        INSERT INTO Apuestas (titulo, fechaEvento, fechaLimite, estado)
        OUTPUT INSERTED.id
        VALUES ('${titulo}', '${fechaEvento}', '${fechaLimite}', 'vigente')
    `);
    return resultado.recordset[0].id;
}

async function destacar(id) {
    await sql.query(`
        UPDATE Apuestas SET destacada = 1 WHERE id = ${id}
    `);
}

async function cerrar(id) {
    await sql.query(`
        UPDATE Apuestas SET estado = 'cerrada' WHERE id = ${id}
    `);
}

module.exports = { obtenerTodas, obtenerVigentes, obtenerCerradas, obtenerPorId, crear, destacar, cerrar };