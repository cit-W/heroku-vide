const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// GET - Obtener nombres por cédula
router.get('/obtener_nombres', async (req, res) => {
  const cedula = req.query.cedula;

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

// POST - Crear un nuevo usuario
router.post('/create_user', async (req, res) => {
  const { name, cedula, nivel, curso } = req.body;

  if (!name || !cedula || !nivel || !curso) {
    return res.status(400).json({ success: false, error: "Faltan datos para completar el registro" });
  }

  try {
    const query = `
      INSERT INTO android_mysql.usuarios 
      (name, cedula, nivel, curso) 
      VALUES ($1, $2, $3, $4)
    `;
    const values = [name, cedula, nivel, curso];
    await pool.query(query, values);

    res.json({ success: true, message: "Usuario registrado con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Error al registrar el usuario" });
  }
});

module.exports = router;
