const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// GET - Obtener IDs de reportes ordenados por profesor
router.get('/IDsReportes', async (req, res) => {
  try {
    const query = "SELECT id FROM android_mysql.reportes ORDER BY profesor;";
    const result = await pool.query(query);

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows });
    } else {
      res.json({ success: true, message: "No se encontraron IDs de reportes" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET - Obtener registros de reportes por ID
router.get('/registro_reportes', async (req, res) => {
  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ success: false, error: "No se proporcionó un ID válido" });
  }

  try {
    const query = 'SELECT * FROM android_mysql.reportes WHERE id = $1 ORDER BY lugar ASC';
    const result = await pool.query(query, [id]);

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows });
    } else {
      res.status(404).json({ success: false, message: "No se encontraron reportes para el ID proporcionado" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
