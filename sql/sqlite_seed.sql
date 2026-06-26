-- Datos iniciales - Modelo del TP

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
