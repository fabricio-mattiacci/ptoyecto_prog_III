const sql = require("mssql");

const config = {
    server: "localhost",
    port: 1433,
    database: "SistemaApuestas",
    user: "sa",
    password: "123456",
    options: {
        trustServerCertificate: true,
        enableArithAbort: true,
    }
};

async function conectar() {
    try {
        await sql.connect(config);
        console.log("Conectado a SQL Server");
    } catch (error) {
        console.error("Error de conexión:", error);
    }
}

module.exports = { sql, conectar };