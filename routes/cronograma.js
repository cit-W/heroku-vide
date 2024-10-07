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

        // Definir los nombres de esquema sin comillas dobles en las variables
        const schemaCurrent = `${year}`;
        const schemaBefore = `${year_before}`;

        const client = await pool.connect();

        // Verifica si el esquema year_before existe
        const schemaExistsQuery = `
            SELECT EXISTS(
                SELECT 1
                FROM information_schema.schemata 
                WHERE schema_name = '${schemaBefore}'
            );
        `;
        const result = await client.query(schemaExistsQuery);

        if (result.rows[0].exists) {
            // Elimina todas las tablas dentro del esquema anterior (schemaBefore) antes de eliminar el esquema
            const dropTablesQuery = `
                DO $$ 
                DECLARE 
                    r RECORD;
                BEGIN
                    -- Selecciona todas las tablas dentro del esquema anterior
                    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = '${year_before}') 
                    LOOP
                        -- Ejecuta un DROP TABLE para cada tabla en el esquema
                        EXECUTE 'DROP TABLE IF EXISTS "${year_before}".' || quote_ident(r.tablename) || ' CASCADE';
                    END LOOP;
                END $$;
            `;
            await client.query(dropTablesQuery);

            // Luego, elimina el esquema anterior
            const dropSchemaQuery = `
                DROP SCHEMA IF EXISTS "${schemaBefore}" CASCADE;
            `;
            await client.query(dropSchemaQuery);
        }

        // Crear el nuevo esquema para el año actual
        const queryYear = `
            CREATE SCHEMA IF NOT EXISTS "${schemaCurrent}"
            AUTHORIZATION u9976s05mfbvrs;
        `;
        await client.query(queryYear);

        // Crear nuevas tablas para los meses en el esquema actual
        for (let i = 0; i < 12; i++) {
            const month = String(i + 1).padStart(2, '0');
            const tableName = `"${schemaCurrent}"."${month}"`;
            
            const queryMonths = `
                CREATE TABLE IF NOT EXISTS ${tableName} (
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

        // Asumiendo que la fecha viene en un formato de timestamp o date string válido
        const formattedDate = format(new Date(fecha), 'yyyy-MM-dd HH:mm'); // Año-mes-día hora:minuto

        const table_year = format(new Date(fecha), 'yyyy'); // Obtiene el año
        const month = format(new Date(fecha), 'MM'); // Obtiene el mes

        const query_create_event = `
            INSERT INTO ${table_year}.${month}
            (id, tema, acargo, mediagroup_video, 
            mediagroup_sonido, fecha, descripcion, lugar)
            VALUES($1, $2, $3, $4, $5, $6, $7, $8);
        `;
        const values = [id, nombre, acargo, mediagroup_video, mediagroup_sonido,
                        formattedDate, descripcion, lugar];

        // Conecta al cliente y ejecuta la consulta
        const client = await pool.connect();
        await client.query(query_create_event, values);
        client.release();

        res.json("SUCCES");
    } catch (err) {
        console.error("Error al crear el evento: ", err);
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
