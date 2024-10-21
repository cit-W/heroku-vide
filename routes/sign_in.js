const express = require('express');
const router = express.Router();
const pool = require('../db.js');

// POST - Crear un nuevo usuario
router.post('/create_user', async (req, res) => {
  const { name, cedula, nivel, curso } = req.query;

  if (!name || !cedula || !nivel || !curso) {
    return res.status(400).json({ success: false, error: "Faltan datos para completar el registro" });
  }

  try {
    // Query 1: Insert new user
    const insertUserQuery = `
      INSERT INTO android_mysql.usuarios 
      (name, cedula, nivel, curso) 
      VALUES ($1, $2, $3, $4)
    `;
    await pool.query(insertUserQuery, [name, cedula, nivel, curso]);

    // Query 2: Create schema
    const createSchemaQuery = `
      CREATE SCHEMA IF NOT EXISTS "citaciones"
      AUTHORIZATION u9976s05mfbvrs
    `;
    await pool.query(createSchemaQuery);

    // Query 3: Create table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS citaciones."${cedula}"
      (
        id SERIAL PRIMARY KEY,
        topic VARCHAR(50) NOT NULL,
        tutor VARCHAR(35),
        student_id INTEGER NOT NULL,
        date TIMESTAMP NOT NULL,
        notes TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pendiente'
      )
    `;
    await pool.query(createTableQuery);

    res.json({ success: true, data: "Usuario registrado con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET - Obtener nombres por cédula
router.get('/obtener_nombres', async (req, res) => {
  const { cedula } = req.query;

  if (!cedula) {
    return res.status(400).json({ success: false, error: "No se proporcionó un profesor válido" });
  }

  try {
    const query = 'SELECT * FROM android_mysql.usuarios WHERE cedula = $1';
    const result = await pool.query(query, [cedula]);

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows }); // Devolver un objeto que contiene el array en un campo 'data'
    } else {
      res.json({ success: false, data: "No se encontró un profesor con la cédula proporcionada"});
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
      res.status(404).json({ success: false, message: "No se encontraron items para el cedula proporcionado" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
