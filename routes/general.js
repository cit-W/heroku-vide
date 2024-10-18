const express = require('express');
const router = express.Router();
const pool = require('./db.js');

router.get('/conexion_verification', async (req, res) => {
  try {
    const query = 'SELECT * FROM android_mysql.usuarios';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/info_user', async (req, res) => {
  const cedula = req.query.cedula;

  if (!cedula) {
    return res.status(400).json({ success: false, error: "No se proporcionó un cedula válido" });
  }

  try {
    const query = 'SELECT * FROM android_mysql.usuarios WHERE cedula = $1';
    const result = await pool.query(query, [cedula]);

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows });
    } else {
      res.status(404).json({ success: false, message: "No se encontraron trabajos sociales para el cedula proporcionado" });
    }
  } catch (err) {
    console.error(err);
  }
})

router.post('/delete_reservas', async (req, res) => {
  const hora_final = req.query.hora_final;

  if (!hora_final) {
    return res.status(400).json({ success: false, error: "No se proporcionó un hora_final válido" });
  }

  try {
    const query = 'DELETE FROM android_mysql.reservar_areas WHERE hora_final = $1';
    const result = await pool.query(query, [hora_final]);

    // Mejora: Verificar el número de filas afectadas en lugar de las filas devueltas
    if (result.rowCount > 0) {
      res.json({ success: true, message: `Se eliminaron ${result.rowCount} reservas` });
    } else {
      res.status(404).json({ success: false, message: "No se encontraron reservas para el hora_final proporcionado" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// asistencia---------------------------------------------------------------

// POST - Registrar asistencia
router.post('/marcar', async (req, res) => {
  const { id, fecha } = req.query;

  if (!id || !fecha) {
    return res.status(400).json({ success: false, error: "Faltan datos para completar el registro" });
  }

  try {
    // Create a new Date object with the current date and time
    const currentDate = new Date();
    
    // Parse the 'fecha' (which is likely just a time string) and set it to today's date
    const [hours, minutes, seconds] = fecha.split(':');
    currentDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), parseInt(seconds, 10));

    // Format the date for PostgreSQL (YYYY-MM-DD HH:MM:SS)
    const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');

    const query = `
      INSERT INTO asistencia.asistencia_diaria 
      (id, fecha) 
      VALUES ($1, $2)
    `;
    const values = [id, formattedDate];
    await pool.query(query, values);
    res.json({ success: true, message: "Asistencia registrada con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Error al registrar el reporte: " + err.message });
  }
});

// GET - Obtener registros por ID del estudiante
router.get('/registro_diario', async (req, res) => {
  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ success: false, error: "No se proporcionó un id válido" });
  }

  try {
    const query = 'SELECT * FROM asistencia.asistencia_diaria WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows });
    } else {
      res.status(404).json({ success: false, message: "No se encontraron info para el id proporcionado" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
