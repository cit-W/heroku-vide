const { format } = require('date-fns');
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

router.post('/crear_cronograma', async (req, res) => {
    try {
        const { year } = req.query;
        const year_before = Number(year) - 1;

        // Verifica si el parámetro está presente
        if (!year) {
            res.status(400).send("El parámetro 'year' es requerido.");
            return;
        }

        const queryYear = `
            DROP SCHEMA IF EXISTS ${year_before};
            CREATE SCHEMA IF NOT EXISTS ${year}
            AUTHORIZATION u9976s05mfbvrs;
        `;

        // Conecta al cliente y ejecuta la consulta
        const client = await pool.connect();
        await client.query(queryYear);

        const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
                        "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE",
                        "DICIEMBRE"];

        for (let i = 0; i < months.length; i++) {
            const queryMonths = `
                CREATE TABLE ${months[i]} (
                    id INT NOT NULL,
                    tema VARCHAR(50) NOT NULL,
                    acargo VARCHAR(40),
                    mediagroup_video VARCHAR(20),
                    mediagroup_sonido VARCHAR(20),
                    fecha DATE NOT NULL,
                    descripcion VARCHAR(200),
                    lugar VARCHAR(40)
                );
            `;
            await client.query(queryMonths);
        }
        client.release();

        res.json("cronograma_registrado");
    } catch (err) {
        console.error("Error al registrar el cronograma: ", err);
        res.status(500).send("Error al registrar el cronograma: " + err.message);
    }
});

router.post('/create_event', async (req, res) => {
    try {
        const { id, nombre, acargo, mediagroup_video, mediagroup_sonido,
                fecha, descripcion, lugar } = req.query;

        const month = format(fecha, "MM");

        const query_create_event = `
            INSERT INTO ${month}
            (id, tema, acargo, mediagroup_video, 
            mediagroup_sonido, fecha, descripcion, lugar)
            VALUES($1, $2, $3, $4, $5, $6, $7, $8);
        `;
        const values = [id, nombre, acargo, mediagroup_video, mediagroup_sonido,
                        fecha, descripcion, lugar];

        // Conecta al cliente y ejecuta la consulta
        const client = await pool.connect();
        await client.query(query_create_event, values);
        client.release();

        res.json("SUCCES");
    } catch (err) {
        console.error("Error al eliminar las tablas: ", err);
        res.status(500).send("Error al eliminar las tablas: " + err.message);
    }
});

router.post('/delete', async (req, res) => {
    try {
        const { year } = req.query;
        const year_before = year - 1;

        // Verifica si el parámetro está presente
        if (!year) {
            res.status(400).send("El parámetro 'year' es requerido.");
            return;
        }

        const queryYear = 'DROP SCHEMA IF EXISTS ${queryYear};';

        const client = await pool.connect();
        await client.query(queryYear);
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
        
        const query = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'horarios_profes'
            ORDER BY table_name ASC;
        `;
        const result = await client.query(query);
        client.release();

        if (result.rows.length > 0) {
            res.json({ success: true, data: result.rows });
        } else {
            res.json({success: true, data: "No_hay_registros"});
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
            FROM horarios_profes.${name} 
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
            res.json({ success: true, data: result.rows });
        } else {
            res.json({
                data: "No_hay_registros"
            });
        }
    } catch (err) {
        console.error("Error al consultar los registros: ", err);
        res.json({
            data: "No_hay_registros"
        });
    }
});

module.exports = router;
