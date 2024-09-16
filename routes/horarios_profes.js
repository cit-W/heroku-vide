const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

router.get('/crear_horario', async (req, res) => {
    try {
        const { Hora, LunesHora, MartesHora, MiercolesHora, JuevesHora, ViernesHora, nombre } = req.query;

        // Verifica si todos los parámetros están presentes
        if (!Hora || !LunesHora || !MartesHora || !MiercolesHora || !JuevesHora || !ViernesHora || !nombre) {
            res.status(400).send("Todos los parámetros son requeridos.");
            return;
        }

        // Crea la consulta SQL para insertar los datos
        const queryDias = `
            INSERT INTO ${nombre} 
            (horas, Lunes, Martes, Miercoles, Jueves, Viernes) 
            VALUES($1, $2, $3, $4, $5, $6);
        `;
        const values = [Hora, LunesHora, MartesHora, MiercolesHora, JuevesHora, ViernesHora];

        // Conecta al cliente y ejecuta la consulta
        const client = await pool.connect();
        await client.query(queryDias, values);
        client.release();

        res.send("Horario registrado");
    } catch (err) {
        console.error("Error al registrar el horario: ", err);
        res.status(500).send("Error al registrar el horario: " + err.message);
    }
});

router.get('/crear_tabla_profe', async (req, res) => {
    try {
        const { profe } = req.query;

        if (!profe) {
            res.status(400).json({ success: 0, message: "El parámetro 'profe' es requerido." });
            return;
        }

        // Crea la consulta SQL para crear la tabla
        const query = `
            CREATE TABLE ${profe} (
                horas VARCHAR(40) NOT NULL,
                Lunes VARCHAR(40) NOT NULL,
                Martes VARCHAR(40) NOT NULL,
                Miercoles VARCHAR(40) NOT NULL,
                Jueves VARCHAR(40) NOT NULL,
                Viernes VARCHAR(40) NOT NULL
            )
        `;

        const client = await pool.connect();
        await client.query(query);
        client.release();

        // Respuesta de éxito
        res.json({ success: 1, message: "La tabla se creó correctamente." });
    } catch (err) {
        console.error("Error al crear la tabla: ", err);
        // Respuesta de error
        res.status(500).json({ success: 0, message: "Error al crear la tabla: " + err.message });
    }
});

router.post('/delete_horarios_all', async (req, res) => {
    try {
        const client = await pool.connect();

        // Obtener el nombre de todas las tablas en la base de datos
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema='horarios_profes';
        `);

        // Eliminar cada tabla
        for (const row of tablesResult.rows) {
            const tableName = row.table_name;
            await client.query(`DROP TABLE IF EXISTS ${tableName}`);
            console.log(`Tabla ${tableName} eliminada exitosamente.`);
        }

        client.release();
        res.send("Todas las tablas han sido eliminadas exitosamente.");
    } catch (err) {
        console.error("Error al eliminar las tablas: ", err);
        res.status(500).send("Error al eliminar las tablas: " + err.message);
    }
});

router.post('/delete_horario', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            res.status(400).send("El parámetro 'name' es requerido.");
            return;
        }

        // Crea la consulta SQL para eliminar la tabla
        const query = `DROP TABLE IF EXISTS horarios_profes.${name}`;

        const client = await pool.connect();
        await client.query(query);
        client.release();

        res.send("Borrado exitosamente");
    } catch (err) {
        console.error("Error al borrar la tabla: ", err);
        res.status(500).send("Error al borrar: " + err.message);
    }
});

router.get('/registro_horario_account', async (req, res) => {
    try {
        const { name } = req.query;

        if (!name) {
            res.status(400).send("El parámetro 'name' es requerido.");
            return;
        }

        const client = await pool.connect();
        const query = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'horarios_profes' 
            AND table_name = $1
            ORDER BY table_name ASC;
        `;
        const result = await client.query(query, [name]);
        client.release();

        if (result.rows.length > 0) {
            res.json(result.rows);
        } else {
            res.send("No_hay_tablas");
        }
    } catch (err) {
        console.error("Error al consultar la tabla: ", err);
        res.status(500).send("Error al consultar la tabla: " + err.message);
    }
});

router.get('/registro_horario', async (req, res) => {
    try {
        const client = await pool.connect();
        
        // Obtén la lista de tablas en el esquema 'public'
        const query = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name ASC;
        `;
        const result = await client.query(query);
        client.release();

        if (result.rows.length > 0) {
            res.json(result.rows);
        } else {
            res.send("No_hay_tablas");
        }
    } catch (err) {
        console.error("Error al consultar las tablas: ", err);
        res.status(500).send("Error al consultar las tablas: " + err.message);
    }
});

router.get('/ver_horario', async (req, res) => {
    try {
        const { name } = req.query;

        if (!name) {
            res.status(400).send("El parámetro 'name' es requerido.");
            return;
        }

        const client = await pool.connect();

        // Consulta SQL para obtener y ordenar registros
        // Nota: PostgreSQL no tiene SUBSTRING_INDEX, pero puedes usar funciones similares para manejar la lógica de conversión de tiempos
        const query = `
            SELECT * 
            FROM ${name} 
            ORDER BY 
                CASE 
                    WHEN horas ~ '^[0-9]+:[0-9]+' THEN 
                        -- Conversión de horas a formato TIME
                        CAST(SPLIT_PART(horas, ' - ', 1) AS TIME)
                    ELSE 
                        '00:00:00' 
                END;
        `;
        const result = await client.query(query);
        client.release();

        if (result.rows.length > 0) {
            res.json(result.rows);
        } else {
            res.json({
                message: "No_hay_registros"
            });
        }
    } catch (err) {
        console.error("Error al consultar los registros: ", err);
        res.json({
            message: "No_hay_registros"
        });
    }
});

module.exports = router;
