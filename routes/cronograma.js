const { format } = require('date-fns');
const express = require('express');
const router = express.Router();
const { ValidationError, DatabaseError } = require('../middleware/errorHandler.js');
const pool = require('../db.js');
const helmet = require('helmet');

router.use(helmet());
router.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'"]
    }
}));

// Parametros para mefiagroup:
//  innecesaario
//  solicitado
//  confirmado
//  denegado

router.post('/create', async (req, res, next) => {
    try {
        const { year } = req.query;

        if (!year) {
            throw new ValidationError('El año es requerido');
        }

        const year_before = Number(year) - 1;
        const schemaCurrent = `${year}`;
        const schemaBefore = `${year_before}`;

        const client = await pool.connect();

        try {
            // Verificar si el esquema anterior existe
            const schemaExistsResult = await client.query(`
                SELECT EXISTS(
                    SELECT 1
                    FROM information_schema.schemata 
                    WHERE schema_name = $1
                )
            `, [schemaBefore]);

            const schemaExists = schemaExistsResult.rows[0].exists;

            await client.query('BEGIN');

            try {
                if (schemaExists) {
                    // Si el esquema anterior existe, eliminarlo
                    await client.query(`DROP SCHEMA IF EXISTS "${schemaBefore}" CASCADE`);
                }

                // Crear nuevo esquema
                await client.query(`
                    CREATE SCHEMA IF NOT EXISTS "${schemaCurrent}"
                    AUTHORIZATION u9976s05mfbvrs
                `);

                // Crear tablas mensuales en el nuevo esquema
                for (let i = 0; i < 12; i++) {
                    const month = String(i + 1).padStart(2, '0');
                    await client.query(`
                        CREATE TABLE IF NOT EXISTS "${schemaCurrent}"."${month}" (
                            id SERIAL PRIMARY KEY,
                            tema VARCHAR(50) NOT NULL,
                            acargo VARCHAR(40),
                            mediagroup_video VARCHAR(20),
                            mediagroup_sonido VARCHAR(20),
                            fecha DATE NOT NULL,
                            descripcion VARCHAR(200),
                            lugar VARCHAR(40),
                            n_semana INT NOT NULL
                        )
                    `);
                }

                await client.query('COMMIT');
                res.json({ success: true, data: "cronograma_registrado" });
            } catch (err) {
                await client.query('ROLLBACK');
                throw new DatabaseError(`Error en la transacción: ${err.message}`);
            }
        } finally {
            client.release();
        }
    } catch (err) {
        next(err);
    }
});

router.post('/create_event', async (req, res) => {
    try {
        const { tema, acargo, mediagroup_video, mediagroup_sonido,
                fecha, descripcion, lugar } = req.query;

        const formattedDate = format(new Date(fecha), 'yyyy-MM-dd HH:mm'); // Año-mes-día hora:minuto

        const table_year = format(new Date(fecha), 'yyyy'); // Obtiene el año
        const month = format(new Date(fecha), 'MM'); // Obtiene el mes

        currentdate = new Date();
        var oneJan = new Date(currentdate.getFullYear(), 0, 1);
        var numberOfDays = Math.floor((currentdate - oneJan) / (24 * 60 * 60 * 1000));
        var result_week = Math.ceil((currentdate.getDay() + 1 + numberOfDays) / 7);

        const query_create_event = `
            INSERT INTO "${table_year}"."${month}"
            (tema, acargo, mediagroup_video, 
            mediagroup_sonido, fecha, descripcion, lugar, n_semana)
            VALUES( $1, $2, $3, $4, $5, $6, $7, $8 );
        `;

        console.log(result_week)
        
        const values = [tema, acargo, mediagroup_video, mediagroup_sonido,
                        formattedDate, descripcion, lugar, result_week];

        // Conecta al cliente y ejecuta la consulta
        const client = await pool.connect();
        await client.query(query_create_event, values);
        
        client.release();

        res.json({ success: true, data: "SUCCESS"});
    } catch (err) {
        console.error("Error al crear el evento: ", err);
        res.status(500).send("Error al crear evento: " + err.message);
    }
});

router.post('/delete', async (req, res) => {
    const client = await pool.connect(); // Asegura que el client esté inicializado correctamente

    try {
        const { year } = req.query;

        // Verifica si el parámetro está presente
        if (!year) {
            res.status(400).send("El parámetro 'year' es requerido.");
            return;
        }

        // Verifica si el esquema year existe
        const schemaExistsQuery = `
            SELECT EXISTS(
                SELECT 1
                FROM information_schema.schemata 
                WHERE schema_name = '${year}'
            );
        `;
        const result = await client.query(schemaExistsQuery);

        if (result.rows[0].exists) {
            // Elimina todas las tablas dentro del esquema antes de eliminar el esquema
            const dropTablesQuery = `
                DO $$ 
                DECLARE 
                    r RECORD;
                BEGIN
                    -- Selecciona todas las tablas dentro del esquema
                    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = '${year}') 
                    LOOP
                        -- Ejecuta un DROP TABLE para cada tabla en el esquema
                        EXECUTE 'DROP TABLE IF EXISTS "${year}".' || quote_ident(r.tablename) || ' CASCADE';
                    END LOOP;
                END $$;
            `;
            await client.query(dropTablesQuery);

            // Luego, elimina el esquema
            const dropSchemaQuery = `
                DROP SCHEMA IF EXISTS "${year}" CASCADE;
            `;
            await client.query(dropSchemaQuery);
        }

        res.json({ success: true, data: "Borrado exitosamente"});
    } catch (err) {
        console.error("Error al borrar la tabla: ", err);
        res.status(500).send("Error al borrar: " + err.message);
    } finally {
        client.release(); // Asegura liberar el client al final
    }
});

router.post('/delete_event', async (req, res) => {
    try {
        const { id, month } = req.query;

        const yearActual = format(new Date(), 'yyyy');

        const client = await pool.connect();
        const query = `
            DELETE 
            FROM "${yearActual}"."${month}"
            WHERE id = $1;
        `;
        const result = await client.query(query, [id]);
        client.release();

        res.json({ success: true, data: "success" });
    } catch (err) {
        console.error("Error al consultar la tabla: ", err);
        res.status(500).send("Error al consultar la tabla: " + err.message);
    }
});

router.get('/month_events', async (req, res) => {
    try {
        const { month } = req.query;

        if (!month) {
            res.status(400).send("El parámetro 'month' es requerido.");
            return;
        }

        const yearActual = format(new Date(), 'yyyy');

        const client = await pool.connect();
        const query = `
            SELECT * 
            FROM "${yearActual}"."${month}";
        `;
        const result = await client.query(query);
        client.release();

        if (result.rows.length > 0) {
            res.json({ success: true, data: result.rows });
        } else {
            res.json({ success: false, data: "No_hay_tablas" });

        }
    } catch (err) {
        console.error("Error al consultar la tabla: ", err);
        res.status(500).send("Error al consultar la tabla: " + err.message);
    }
});

router.get('/month_topic', async (req, res) => {
    try {
        const { month } = req.query;

        if (!id) {
            res.status(400).send("El parámetro 'month' es requerido.");
            return;
        }

        const yearActual = format(new Date(), 'yyyy');

        const client = await pool.connect();
        const query = `
            SELECT tema 
            FROM "${yearActual}"."${month}"
            WHERE id = 0;
        `;
        const result = await client.query(query, [month]);
        client.release();

        if (result.rows.length > 0) {
            res.json({ success: true, data: result.rows });
        } else {
            res.json({ success: false, data: "No_hay_tablas" });
        }
    } catch (err) {
        res.json({ success: false, data: "No_hay_tablas" });
    }
});

router.get('/week_events', async (req, res) => {
    try {

        currentdate = new Date();
        var oneJan = new Date(currentdate.getFullYear(), 0, 1);
        var numberOfDays = Math.floor((currentdate - oneJan) / (24 * 60 * 60 * 1000));
        var result_week = Math.ceil((currentdate.getDay() + 1 + numberOfDays) / 7);

        console.log(result_week)

        const yearActual = format(new Date(), 'yyyy');
        const monthActual = format(new Date(), 'MM');

        const client = await pool.connect();
        const query = `
            SELECT * 
            FROM "${yearActual}"."${monthActual}"
            WHERE n_semana = $1;
        `;
        const result = await client.query(query, [result_week]);
        client.release();

        // id, tema, acargo, mediagroup_video, mediagroup_sonido,
        // fecha, descripcion, lugar, n_semana

        if (result.rows.length > 0) {
            res.json({ success: true, data: result.rows });
        } else {
            res.json({ success: false, data: "No_hay_tablas" });
        }
    } catch (err) {
        console.error("Error al consultar la tabla: ", err);
        res.status(500).send("Error al consultar la tabla: " + err.message);
    }
});

router.get('/event', async (req, res) => {
    try {
        const { id, month } = req.query;

        const yearActual = format(new Date(), 'yyyy');

        const client = await pool.connect();
        const query = `
            SELECT  * 
            FROM "${yearActual}"."${month}"
            WHERE id = $1;
        `;
        const result = await client.query(query, [id]);
        client.release();

        if (result.rows.length > 0) {
            res.json({ success: true, data: result.rows });
        } else {
            res.json({ success: false, data: "No_hay_tablas" });
        }
    } catch (err) {
        console.error("Error al consultar la tabla: ", err);
        res.status(500).send("Error al consultar la tabla: " + err.message);
    }
});

router.post('/mediagroup', async (req, res) => {
    try {
        const { id, month, video, sonido } = req.query;

        const yearActual = format(new Date(), 'yyyy');

        const client = await pool.connect();
        const query = `
            UPDATE "${yearActual}"."${month}"
            SET mediagroup_video = '$1',
                mediagroup_sonido = '$2'
            WHERE id = $3;
        `;
        const values = [video, sonido, id];
        const result = await client.query(query, values);
        client.release();

        if (result.rows.length > 0) {
            res.json({ success: true, data: result.rows });
        } else {
            res.json({ success: false, data: "No_hay_tablas" });
        }
    } catch (err) {
        console.error("Error al consultar la tabla: ", err);
        res.status(500).send("Error al consultar la tabla: " + err.message);
    }
});

router.get('/list_mediagroup', async (req, res) => {
    let client;
    try {
        // Obtener la fecha actual
        const currentdate = new Date();
        const oneJan = new Date(currentdate.getFullYear(), 0, 1);
        
        // Calcular el número de días y la semana actual
        const numberOfDays = Math.floor((currentdate - oneJan) / (24 * 60 * 60 * 1000));
        const result_week = Math.ceil((numberOfDays + currentdate.getDay() + 1) / 7);
        
        // Obtener el año y mes actuales en formato 'yyyy' y 'MM'
        const yearActual = format(currentdate, 'yyyy');
        const monthActual = format(currentdate, 'MM');

        // Calcular el mes siguiente
        const nextMonthDate = new Date(currentdate.getFullYear(), currentdate.getMonth() + 1, 1);
        const monthNext = format(nextMonthDate, 'MM');

        // Conectar a la base de datos
        client = await pool.connect();

        // Consulta SQL para el mes actual
        const queryCurrentMonth = `
            SELECT * 
            FROM "${yearActual}"."${monthActual}"
            WHERE n_semana IN ($1, $2, $3, $4);
        `;
        const values = [result_week, result_week + 1, result_week + 2, result_week + 3];

        // Ejecutar la consulta en el mes actual
        let resultCurrentMonth = await client.query(queryCurrentMonth, values);

        // Arreglo para almacenar semanas faltantes
        let semanasFaltantes = [];
        const semanasBuscadas = [result_week, result_week + 1, result_week + 2, result_week + 3];

        // Filtrar las semanas faltantes
        semanasBuscadas.forEach(semana => {
            if (!resultCurrentMonth.rows.some(row => row.n_semana === semana)) {
                semanasFaltantes.push(semana);
            }
        });

        // Si hay semanas faltantes, buscar en el mes siguiente
        if (semanasFaltantes.length > 0) {
            const queryNextMonth = `
                SELECT * 
                FROM "${yearActual}"."${monthNext}"
                WHERE n_semana IN (${semanasFaltantes.map((_, i) => `$${i + 1}`).join(", ")});
            `;
            const resultNextMonth = await client.query(queryNextMonth, semanasFaltantes);

            // Combinar resultados del mes actual y el siguiente
            resultCurrentMonth.rows = [...resultCurrentMonth.rows, ...resultNextMonth.rows];
        }

        // Verificar si se encontraron datos
        if (resultCurrentMonth.rows.length > 0) {
            res.json(resultCurrentMonth.rows);
        } else {
            // Si no hay datos en ninguna tabla, retornar un JSON indicando que no hay tablas
            res.json({ success: false, data: "No_hay_tablas" });
        }
    } catch (err) {
        console.error("Error al consultar la tabla: ", err);
        res.status(500).json({ error: "Error al consultar la tabla: " + err.message });
    } finally {
        // Asegurarse de liberar el cliente de la base de datos
        if (client) {
            client.release();
        }
    }
});

module.exports = router;
