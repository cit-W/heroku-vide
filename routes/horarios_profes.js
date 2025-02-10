const express = require('express');
const router = express.Router();
const pool = require('../db.js');

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
        res.json({ success: true, message: "La tabla se creó correctamente." });
    } catch (err) {
        console.error("Error al crear la tabla: ", err);
        res.status(500).json({ success: false, message: "Error al crear la tabla: " + err.message });
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

router.post('/delete_horario/:name', async (req, res) => {
    const name = req.params.name;

    if (!name) {
        return res.status(400).json({ success: false, error: "Nombre de tabla inválido" });
    }

    try {
        // Construimos la consulta de forma dinámica, ya que no se pueden usar parámetros en nombres de tabla
        const query = `DROP TABLE IF EXISTS horarios_profes."${name}"`;
        
        // Ejecutamos la consulta (DROP TABLE no devuelve filas, así que no usamos result.rows)
        await pool.query(query);

        res.json({ success: true, message: `Tabla '${name}' eliminada exitosamente` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/registro_horario_account', async (req, res) => {
    try {
        const { name } = req.query;
        nameCorrect = name.toLowerCase()

        if (!nameCorrect) {
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
        const result = await client.query(query, [nameCorrect]);
        client.release();

        if (result.rows.length > 0) {
            const tables = result.rows.map(row => ({ name: row.table_name }));
            res.json({ success: true, data: tables });
        } else {
            res.status(404).json({ success: false, message: "No hay tablas que coincidan con el nombre proporcionado" });
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
            res.json({ success: false, message: "No se encontraron reservas para el ID proporcionado" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
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

router.get('/verificar_existencia', async (req, res) => {
    try {
        const { profe } = req.query;

        if (!profe) {
            res.status(400).send("El parámetro 'name' es requerido.");
            return;
        }
        const client = await pool.connect();
        
        const query = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'horarios_profes'
			AND table_name = '$1'
            ORDER BY table_name ASC;
        `;
        const result = await client.query(query, [ IdProfe ]);
        client.release();

        if (result.rows.length > 0) {
            res.json({ success: true, data: result.rows });
        } else {
            res.json({ success: false, message: "No se encontraron reservas para el ID proporcionado" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
