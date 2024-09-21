const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// GET - Obtener registros por ID del estudiante
router.get('/registro_diario', async (req, res) => {
  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ success: false, error: "No se proporcionó un id válido" });
  }

  try {
    const query = 'SELECT id FROM asistencia.asistencia_diaria WHERE id = $1 ORDER BY lugar';
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

// POST - Registrar asistencia
router.post('/marcar', async (req, res) => {
  const { id, fecha } = req.query;

  if (!id || !fecha) {
    return res.status(400).json({ success: false, error: "Faltan datos para completar el registro" });
  }

  try {
    const query = `
      INSERT INTO asistencia.asistencia_diaria 
      (id, fecha) 
      VALUES ($1, $2)
    `;
    const values = [id, fecha];
    await pool.query(query, values);
    res.json({ success: true, message: "Asistencia registrada con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Error al registrar el reporte" });
  }
});

module.exports = router;
