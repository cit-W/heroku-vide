const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// POST - Crear un nuevo usuario
router.post('/create_user', async (req, res) => {
  const { name, cedula, nivel, curso } = req.query;

  if (!name || !cedula || !nivel || !curso) {
    return res.status(400).json({ success: false, error: "Faltan datos para completar el registro" });
  }

  try {
    const query = `
      INSERT INTO android_mysql.usuarios 
      (name, cedula, nivel, curso) 
      VALUES ($1, $2, $3, $4);

      CREATE SCHEMA IF NOT EXISTS "citaciones"

      AUTHORIZATION u9976s05mfbvrs;

      CREATE TABLE IF NOT EXISTS citaciones."${cedula}"
      (
        id SERIAL PRIMARY KEY,
        person VARCHAR(40),
        topic VARCHAR(50) NOT NULL,
        tutor VARCHAR(35),
        student_id INTEGER NOT NULL,
        date DATE NOT NULL,
        notes TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        );

    `;
    const values = [name, cedula, nivel, curso];
    await pool.query(query, values);

    res.json({ success: true, data: "Usuario registrado con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Error al registrar el usuario" });
  }
});

// GET - Obtener nombres por cédula
router.get('/obtener_nombres', async (req, res) => {
  const { cedula } = req.query;

  if (!cedula) {
    return res.status(400).json({ success: false, error: "No se proporcionó un profesor válido" });
  }

  try {
    const query = 'SELECT cedula FROM android_mysql.usuarios WHERE cedula = $1';
    const result = await pool.query(query, [cedula]);

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows }); // Devolver un objeto que contiene el array en un campo 'data'
    } else {
      res.json({ success: true, message: "No se encontró un profesor con la cédula proporcionada", data: [] });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
