const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

router.get('/IDsReportes', async (req, res) => {
  try {
    const query = "SELECT id FROM android_mysql.reportes ORDER BY profesor;";
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/registro_reportes', async (req, res) => {
  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ error: "No se proporcionó un profesor válido" });
  }

  try {
    const query = 'SELECT * FROM android_mysql.reportes WHERE id= $1 ORDER BY lugar ASC';
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
