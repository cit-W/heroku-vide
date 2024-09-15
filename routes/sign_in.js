const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

router.get('/obtener_nombres', async (req, res) => {
  const cedula = req.query.cedula;

  if (!cedula) {
    return res.status(400).json({ error: "No se proporcionó un profesor válido" });
  }

  try {
    const query = 'SELECT cedula FROM android_mysql.usuarios WHERE cedula = $1';
    const result = await pool.query(query, [cedula]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/create_user', async (req, res) => {
  const { name, cedula, nivel, curso } = req.body;

  if ( !name || !cedula || !nivel || !curso ) {
    return res.status(400).json({ error: "Faltan datos para completar el registro" });
  }

  try {
    const query = `
      INSERT INTO android_mysql.usuarios 
      (name, cedula, nivel, curso) 
      VALUES ($1, $2, $3, $4)
    `;
    const values = [name, cedula, nivel, curso];
    await pool.query(query, values);
    res.json({ message: "Reserva registrada con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar la reserva" });
  }
});

module.exports = router;
