const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

router.post('/add_trabajo_social', async (req, res) => {
  const { profesor, descripcion, cantidad_horas, cuando } = req.body;

  if ( !profesor || !descripcion || !cantidad_horas || !cuando ) {
    return res.status(400).json({ error: "Faltan datos para completar el registro" });
  }

  try {
    const query = `
      INSERT INTO android_mysql.usuarios 
      (profesor, descripcion, cantidad_horas, cuando) 
      VALUES ($1, $2, $3, $4)
    `;
    const values = [profesor, descripcion, cantidad_horas, cuando];
    await pool.query(query, values);
    res.json({ message: "Reserva registrada con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar la reserva" });
  }
});

router.get('/ids_trabajo_social', async (req, res) => {
  try {
    const query = 'SELECT id FROM android_mysql.trabajo_social';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/registro_trabajo_social', async (req, res) => {
  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ error: "No se proporcionó un profesor válido" });
  }

  try {
    const query = 'SELECT * FROM android_mysql.trabajo_social WHERE id = $1 ORDER BY descripcion ASC';
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
