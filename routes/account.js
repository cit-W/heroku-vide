const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

router.delete('/delete_reserva_personal', async (req, res) => {
  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ error: "No se proporcionó un ID válido" });
  }

  try {
    const query = 'DELETE FROM android_mysql.reservar_areas WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rowCount > 0) {
      res.json({ message: "Borrado exitosamente" });
    } else {
      res.status(404).json({ error: "Error al borrar o el ID no existe" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/delete_social_personal', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM personas');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/reservasIDs_personal', async (req, res) => {
  const { profesor } = req.query;

  if (!profesor) {
    return res.status(400).json({ error: "Se debe proporcionar el nombre del profesor" });
  }

  try {
    const query = 'SELECT id FROM reservar_areas WHERE profesor = $1 ORDER BY lugar';
    const result = await pool.query(query, [profesor]);

    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.json({ message: "No hay registros" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/socialIDs_personal', async (req, res) => {
  const profesor = req.query.profesor;

  if (!profesor) {
    return res.status(400).json({ error: "No se proporcionó un profesor válido" });
  }

  try {
    const query = 'SELECT id FROM android_mysql.trabajo_social WHERE profesor = $1';
    const result = await pool.query(query, [profesor]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;