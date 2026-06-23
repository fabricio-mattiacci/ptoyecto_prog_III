const { sql } = require("../config/db");

async function obtenerPorApuesta(idApuesta) {
    const resultado = await sql.query(`
        SELECT p.id, p.idApuesta, p.descripcion, p.dividendo,
               ISNULL(SUM(au.monto), 0) AS totalApostado
        FROM Pronosticos p
        LEFT JOIN ApuestasUsuarios au ON p.id = au.idPronostico
        WHERE p.idApuesta = ${idApuesta}
        GROUP BY p.id, p.idApuesta, p.descripcion, p.dividendo
    `);
    return resultado.recordset;
}

async function crear(pronostico) {
    const { idApuesta, descripcion } = pronostico;
    await sql.query(`
        INSERT INTO Pronosticos (idApuesta, descripcion, dividendo)
        VALUES (${idApuesta}, '${descripcion}', 0)
    `);
}

async function actualizarDividendo(idApuesta) {
    // Calcular pozo bruto
    const pozo = await sql.query(`
        SELECT SUM(monto) as total FROM ApuestasUsuarios au
        JOIN Pronosticos p ON au.idPronostico = p.id
        WHERE p.idApuesta = ${idApuesta}
    `);
    
    const pozoBruto = pozo.recordset[0].total || 0;
    const comision = pozoBruto * 0.10;
    const pozoNeto = pozoBruto - comision;

    // Actualizar dividendo de cada pronóstico
    const pronosticos = await sql.query(`
        SELECT p.id, SUM(au.monto) as totalApostado
        FROM Pronosticos p
        LEFT JOIN ApuestasUsuarios au ON p.id = au.idPronostico
        WHERE p.idApuesta = ${idApuesta}
        GROUP BY p.id
    `);

    for (const p of pronosticos.recordset) {
        const totalApostado = p.totalApostado || 0;
        const dividendo = totalApostado > 0 ? pozoNeto / totalApostado : 0;
        await sql.query(`
            UPDATE Pronosticos SET dividendo = ${dividendo} WHERE id = ${p.id}
        `);
    }
}

async function obtenerEstadoApuesta(idPronostico) {
    const resultado = await sql.query(`
        SELECT a.estado
        FROM Pronosticos p
        JOIN Apuestas a ON a.id = p.idApuesta
        WHERE p.id = ${idPronostico}
    `);
    return resultado.recordset[0];
}

async function apostar(idUsuario, idPronostico, monto) {
    await sql.query(`
        INSERT INTO ApuestasUsuarios (idUsuario, idPronostico, monto)
        VALUES (${idUsuario}, ${idPronostico}, ${monto})
    `);
}

module.exports = { obtenerPorApuesta, crear, actualizarDividendo, apostar, obtenerEstadoApuesta };