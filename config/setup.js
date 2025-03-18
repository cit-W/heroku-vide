// database/setup.js
const pool = require("./db");

const setupDatabase = async () => {
    try {
        console.log("🔄 Verificando y creando tablas necesarias...");

        await pool.query(`
        CREATE TABLE IF NOT EXISTS organizaciones (
            id VARCHAR(16) PRIMARY KEY,
            name TEXT NOT NULL,
            contact TEXT UNIQUE NOT NULL,
            status VARCHAR(10) CHECK (estado IN ('free', 'premium')),
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_vencimiento TIMESTAMP
        );
        `);

        await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            personal_id VARCHAR(20) UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            organizacion_id VARCHAR(16) REFERENCES organizaciones(id) ON DELETE CASCADE,
            role TEXT NOT NULL,
            departamento TEXT NOT NULL,
            escuela TEXT NOT NULL,
            curso TEXT NOT NULL
        );
        `);

        await pool.query(`
        CREATE TABLE IF NOT EXISTS grades (
            id SERIAL PRIMARY KEY,
            nombre TEXT NOT NULL,
            organizacion_id VARCHAR(16) REFERENCES organizaciones(id) ON DELETE CASCADE
        );
        `);

        await pool.query(`
        CREATE TABLE IF NOT EXISTS places (
            id SERIAL PRIMARY KEY,
            nombre TEXT NOT NULL,
            organizacion_id VARCHAR(16) REFERENCES organizaciones(id) ON DELETE CASCADE
        );
        `);

        console.log("✅ Todas las tablas han sido verificadas o creadas correctamente.");
    } catch (error) {
        console.error("❌ Error al configurar la base de datos:", error);
    } finally {
        await pool.end();
    }
};

setupDatabase();