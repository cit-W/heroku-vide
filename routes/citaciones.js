const { format, parse } = require('date-fns');
const express = require('express');
const router = express.Router();
const pool = require('./db.js');

// Ruta principal
router.get('/', (req, res) => res.json({ success: true, data: "SUCCESS"}));

router.post('/create_citation', async (req, res) => {
    try {
        const { person, topic, tutor, student_id, date, notes, status } = req.query;

        // Parsear la fecha desde el formato 'dd-MM-yyyy HH:mm' a un objeto Date
        const parsedDate = parse(date, 'dd-MM-yyyy HH:mm', new Date());
        const formattedDate = format(parsedDate, 'yyyy-MM-dd HH:mm'); // Formatear para PostgreSQL

        // SQL para crear el esquema si no existe
        const query_create_schema = `
            CREATE SCHEMA IF NOT EXISTS "citaciones"
            AUTHORIZATION u9976s05mfbvrs;
        `;

        // SQL para crear la tabla si no existe
        const query_create_table = `
            CREATE TABLE IF NOT EXISTS citaciones."${person}" (
                id SERIAL PRIMARY KEY,
                topic VARCHAR(50) NOT NULL,
                tutor VARCHAR(35),
                student_id INTEGER NOT NULL,
                date TIMESTAMP NOT NULL,
                notes TEXT,
                status VARCHAR(20) NOT NULL DEFAULT 'Pendiente'
            );
        `;

        // SQL para insertar la cita
        const query_insert_event = `
            INSERT INTO citaciones."${person}" ( topic, tutor, student_id, date, notes, status)
            VALUES ($1, $2, $3, $4, $5, $6);
        `;

        const values = [ topic, tutor, student_id, formattedDate, notes, status ];

        const client = await pool.connect();

        // Ejecutar las consultas por separado
        await client.query(query_create_schema); // Crear el esquema si no existe
        await client.query(query_create_table);  // Crear la tabla si no existe
        await client.query(query_insert_event, values); // Insertar la cita

        client.release();

        res.json({ success: true, data: "SUCCESS" });
    } catch (err) {
        console.error("Error al crear el evento: ", err);
        res.status(500).send("Error al crear evento: " + err.message);
    }
});

router.get('/get_citations', async (req, res) => {
    try {
        const { person, status } = req.query;

        if (!person || !status) {
            res.status(400).send("Los parámetros 'person' y 'status' son requeridos.");
            return;
        }

        const client = await pool.connect();
        const query = `
            SELECT *  
            FROM citaciones."${person}"
            WHERE status = $1;
        `;

        // Pasar el valor de status como un array
        const result = await client.query(query, [status]);
        client.release();

        if (result.rows.length > 0) {
            res.json({ success: true, data: result.rows });
        } else {
            res.json({ success: false, data: "No hay citas." });
        }
    } catch (err) {
        res.json({ success: false, data: "No hay citas." });
        console.error("Error al consultar la tabla: ", err);
    }
});

router.put('/update_citation', async (req, res) => {
    try {
        const { person, id, topic, tutor, date, notes, status } = req.query;

        if (!person || !id) {
            res.status(400).send("El campo 'person' y 'id' son requeridos.");
            return;
        }

        const client = await pool.connect();

        // Construir dinámicamente la consulta SQL
        let updateFields = [];
        let values = [];
        let counter = 1; // Para manejar los placeholders ($1, $2, ...)

        if (topic) {
            updateFields.push(`topic = $${counter}`);
            values.push(topic);
            counter++;
        }
        if (tutor) {
            updateFields.push(`tutor = $${counter}`);
            values.push(tutor);
            counter++;
        }
        if (date) {
            // Parsear la fecha desde el formato 'dd-MM-yyyy HH:mm'
            const parsedDate = parse(date, 'dd-MM-yyyy HH:mm', new Date());
            const formattedDate = format(parsedDate, 'yyyy-MM-dd HH:mm'); // Formatear para PostgreSQL
            updateFields.push(`date = $${counter}`);
            values.push(formattedDate);
            counter++;
        }
        if (notes) {
            updateFields.push(`notes = $${counter}`);
            values.push(notes);
            counter++;
        }
        if (status) {
            updateFields.push(`status = $${counter}`);
            values.push(status);
            counter++;
        }

        // Si no hay campos para actualizar
        if (updateFields.length === 0) {
            res.status(400).send("No hay campos para actualizar.");
            return;
        }

        // Agregar el campo 'id' al final para el WHERE
        values.push(id);

        const query = `
            UPDATE citaciones."${person}"
            SET ${updateFields.join(', ')}
            WHERE id = $${counter};
        `;

        await client.query(query, values);
        client.release();

        // Respuesta estándar
        res.json({ success: true, data: "SUCCESS" });
    } catch (err) {
        console.error("Error al consultar la tabla: ", err);
        res.status(500).send("Error al consultar la tabla: " + err.message);
    }
});

module.exports = router;
