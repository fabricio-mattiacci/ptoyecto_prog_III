-- ═══════════════════════════════════════════════════════════════
-- sqlite_seed.sql — DATOS DE PRUEBA (solo si la tabla personas está vacía)
-- ═══════════════════════════════════════════════════════════════
-- Admin: admin@email.com / admin123
-- Tomás:  tomas@email.com  / user123
-- Fabricio: fabricio@email.com / user123
-- Apuesta de ejemplo: Argentina vs Alemania con apuestas de Tomás

INSERT INTO personas (persona, apellido, nombre, dni, fecha_nacimiento, mail, telefono, estado, clave)
VALUES
    (1, 'Sistema', 'Admin', NULL, '2001-02-18', 'admin@email.com', NULL, 'ADM', 'admin123'),
    (2, 'Machuca', 'Tomás', NULL, '2001-02-18', 'tomas@email.com', NULL, 'ACT', 'user123'),
    (3, 'Mattiacci', 'Fabricio', NULL, '2005-10-27', 'fabricio@email.com', NULL, 'ACT', 'user123');

INSERT INTO apuestas (apuesta, evento, fecha_evento, fecha_cierre, prioridad, comision, estado)
VALUES
    (1003, 'Argentina vs Alemania', '2026-06-27', '2026-06-26', 1, 10, 'ACT');

INSERT INTO Apuestas_detalle (apuesta, ocurrencia, descripcion)
VALUES
    (1003, 1, 'Argentina'),
    (1003, 2, 'Alemania');

INSERT INTO Apuestas_personas (apuesta, ocurrencia, persona, importe)
VALUES
    (1003, 1, 2, 500),
    (1003, 2, 2, 300);
