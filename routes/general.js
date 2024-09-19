const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

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
    res.status(500).json({ success: false, error: err.message });
  }
});

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

module.exports = router;
