const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

router.get('/ids', async (req, res) => {
  try {
    const query = "SELECT id FROM android_mysql.reservar_areas ORDER BY lugar;";
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/registro_reservas', async (req, res) => {
  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ error: "No se proporcionó un profesor válido" });
  }

  try {
    const query = "SELECT * FROM android_mysql.reservar_areas WHERE id = $1 ORDER BY lugar ASC";
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/reportar', async (req, res) => {
  const { profesor, clase, lugar, hora_inicio, hora_final } = req.body;

  if (!profesor || !clase || !lugar || !hora_inicio || !hora_final) {
    return res.status(400).json({ error: "Faltan datos para completar el registro" });
  }

  try {
    const query = `
      INSERT INTO android_mysql.reportes 
      (profesor, clase, lugar, hora_inicio, hora_final) 
      VALUES ($1, $2, $3, $4, $5)
    `;
    const values = [profesor, clase, lugar, hora_inicio, hora_final];
    await pool.query(query, values);
    res.json({ message: "Reserva registrada con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar la reserva" });
  }
});

router.post('/reservar_lugar', async (req, res) => {
  const { profesor, clase, lugar, hora_inicio, hora_final } = req.body;

  if (!profesor || !clase || !lugar || !hora_inicio || !hora_final) {
    return res.status(400).json({ error: "Faltan datos para completar el registro" });
  }

  try {
    const query = `
      INSERT INTO android_mysql.reservar_areas 
      (profesor, clase, lugar, hora_inicio, hora_final) 
      VALUES ($1, $2, $3, $4, $5)
    `;
    const values = [profesor, clase, lugar, hora_inicio, hora_final];
    await pool.query(query, values);
    res.json({ message: "Reserva registrada con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar la reserva" });
  }
});


module.exports = router;
