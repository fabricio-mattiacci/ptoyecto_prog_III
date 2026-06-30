/*
 * calcularTotales.js — SUM(importe) EN SQL (sin JOIN)
 * ───────────────────────────────────────────────────
 * Como el ejemplo del profe con MAX, pero usando SUM para:
 * - Pozo bruto de una apuesta (suma de todos los importes).
 * - Total apostado por cada ocurrencia (opción).
 * - Dividendo = pozoNeto / totalApostado en esa opción.
 */

/** Suma todos los importes de Apuestas_personas para una apuesta. */
function calcularPozoBruto(db, apuestaId) {
    const fila = db.prepare(`
        SELECT IFNULL(SUM(importe), 0) AS total
        FROM Apuestas_personas
        WHERE apuesta = ?
    `).get(apuestaId);

    return fila.total || 0;
}

/** Pozo bruto menos el % de comisión de la tabla apuestas. */
function calcularPozoNeto(db, apuestaId) {
    const apuesta = db.prepare(`
        SELECT comision FROM apuestas WHERE apuesta = ?
    `).get(apuestaId);

    const pozoBruto = calcularPozoBruto(db, apuestaId);
    const comision = apuesta ? apuesta.comision : 10;
    return pozoBruto - (pozoBruto * comision / 100);
}

/** Suma importes solo de una ocurrencia (una opción del pronóstico). */
function sumarImporteOcurrencia(db, apuestaId, ocurrencia) {
    const fila = db.prepare(`
        SELECT IFNULL(SUM(importe), 0) AS total
        FROM Apuestas_personas
        WHERE apuesta = ? AND ocurrencia = ?
    `).get(apuestaId, ocurrencia);

    return fila.total || 0;
}

/** Lista opciones de una apuesta con totalApostado y dividendo calculados. */
function obtenerPronosticosConTotales(db, apuestaId) {
    const pozoNeto = calcularPozoNeto(db, apuestaId);

    const detalles = db.prepare(`
        SELECT apuesta, ocurrencia, descripcion
        FROM Apuestas_detalle
        WHERE apuesta = ?
        ORDER BY ocurrencia
    `).all(apuestaId);

    return detalles.map(function(d) {
        const totalApostado = sumarImporteOcurrencia(db, apuestaId, d.ocurrencia);
        return {
            ocurrencia: d.ocurrencia,
            apuesta: d.apuesta,
            descripcion: d.descripcion,
            totalApostado: totalApostado,
            dividendo: totalApostado > 0 ? pozoNeto / totalApostado : 0
        };
    });
}

module.exports = {
    calcularPozoBruto,
    calcularPozoNeto,
    sumarImporteOcurrencia,
    obtenerPronosticosConTotales
};
