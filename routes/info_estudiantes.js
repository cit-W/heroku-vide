const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

router.get('/registro_estudiante_name', async (req, res) => {
  const nombre = req.query.nombre;

  if (!nombre) {
    return res.status(400).json({ error: "No se proporcionó un profesor válido" });
  }

  try {
    const query = 'SELECT * FROM android_mysql.id2024sql WHERE nombre = $1';
    const result = await pool.query(query, [nombre]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/registro_estudiante', async (req, res) => {
  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ error: "No se proporcionó un profesor válido" });
  }

  try {
    const query = 'SELECT * FROM android_mysql.id2024sql WHERE id = $1';
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/registro_reservas', async (req, res) => {
  try {
    const query = 'SELECT * FROM android_mysql.reservar_areas ORDER BY lugar ASC';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
