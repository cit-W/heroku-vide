import pool from "./db.js";

const setupDatabase = async () => {
    try {
        console.log("🔄 Verificando y creando tablas necesarias...");

        // Crear la tabla de organizaciones primero
        await pool.query(`
            DROP TABLE IF EXISTS reserva;
            DROP TABLE IF EXISTS grades CASCADE;
            DROP TABLE IF EXISTS places CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
            DROP TABLE IF EXISTS organizaciones CASCADE;
            DROP TABLE IF EXISTS roles CASCADE;
            DROP TABLE IF EXISTS escuela CASCADE;
            DROP TABLE IF EXISTS departamento CASCADE;
            CREATE TABLE IF NOT EXISTS organizaciones (
                id VARCHAR(16) PRIMARY KEY,
                name TEXT NOT NULL,
                contact TEXT UNIQUE NOT NULL,
                estado VARCHAR(10) CHECK (estado IN ('free', 'premium')),
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_vencimiento TIMESTAMP
            );
        `);

        // Crear la tabla de usuarios
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

        // Crear la tabla de los dispositivos del usuario
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_devices (
                id SERIAL PRIMARY KEY,
                personal_id VARCHAR(20) REFERENCES users(personal_id) ON DELETE CASCADE,
                player_id TEXT UNIQUE NOT NULL,
                device_type TEXT NOT NULL, 
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Crear la tabla de grados
        await pool.query(`
            CREATE TABLE IF NOT EXISTS grades (
                id SERIAL PRIMARY KEY,
                nombre TEXT NOT NULL,
                organizacion_id VARCHAR(16) REFERENCES organizaciones(id) ON DELETE CASCADE,
                UNIQUE (nombre, organizacion_id)
            );
        `);

        // Crear la tabla de roles
        await pool.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                nombre TEXT NOT NULL,
                organizacion_id VARCHAR(16) REFERENCES organizaciones(id) ON DELETE CASCADE,
                UNIQUE (nombre, organizacion_id)
            );
        `);

        // Crear la tabla de departamentos
        await pool.query(`
            CREATE TABLE IF NOT EXISTS departamento (
                id SERIAL PRIMARY KEY,
                nombre TEXT NOT NULL,
                organizacion_id VARCHAR(16) REFERENCES organizaciones(id) ON DELETE CASCADE,
                UNIQUE (nombre, organizacion_id)
            );
        `);

        // Crear la tabla de escuelas
        await pool.query(`
            CREATE TABLE IF NOT EXISTS escuela (
                id SERIAL PRIMARY KEY,
                nombre TEXT NOT NULL,
                organizacion_id VARCHAR(16) REFERENCES organizaciones(id) ON DELETE CASCADE,
                UNIQUE (nombre, organizacion_id)
            );
        `);

        // Crear la tabla de lugares
        await pool.query(`
            CREATE TABLE IF NOT EXISTS places (
                id SERIAL PRIMARY KEY,
                nombre TEXT NOT NULL,
                organizacion_id VARCHAR(16) REFERENCES organizaciones(id) ON DELETE CASCADE,
                UNIQUE (nombre, organizacion_id)
            );
        `);

        // Crear la tabla de reserva
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reserva (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                grade TEXT NOT NULL,
                place TEXT NOT NULL,
                start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                finish TIMESTAMP,
                organizacion_id VARCHAR(16) REFERENCES organizaciones(id) ON DELETE CASCADE
            );
        `);

        // Crear la tabla de trabajo_social
        await pool.query(`
            CREATE TABLE IF NOT EXISTS trabajo_social (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                hours TEXT NOT NULL,
                date TIMESTAMP,
                organizacion_id VARCHAR(16) REFERENCES organizaciones(id) ON DELETE CASCADE
            );
        `);

        // Crear la tabla de reporte_lugar
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reporte_lugar (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                grade TEXT NOT NULL,
                place TEXT NOT NULL,
                start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                finish TIMESTAMP,
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