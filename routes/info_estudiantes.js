const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// GET - Obtener estudiante por nombre
router.get('/registro_estudiante_name', async (req, res) => {
  const nombre = req.query.nombre;

  if (!nombre) {
    return res.status(400).json({ success: false, error: "No se proporcionó un nombre válido" });
  }

  try {
    const query = 'SELECT * FROM android_mysql.id2024sql WHERE nombre = $1';
    const result = await pool.query(query, [nombre]);

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows });
    } else {
      res.json({ success: true, message: "No se encontraron registros para el nombre proporcionado" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET - Obtener estudiante por ID
router.get('/registro_estudiante', async (req, res) => {
  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ success: false, error: "No se proporcionó un ID válido" });
  }

  try {
    const query = 'SELECT * FROM android_mysql.id2024sql WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows });
    } else {
      res.status(404).json({ success: false, message: "No se encontraron registros para el ID proporcionado" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET - Obtener todas las reservas ordenadas por lugar
router.get('/registro_reservas', async (req, res) => {
  try {
    const query = 'SELECT * FROM android_mysql.reservar_areas ORDER BY lugar ASC';
    const result = await pool.query(query);

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows });
    } else {
      res.json({ success: true, message: "No se encontraron reservas" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
