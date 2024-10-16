const express = require('express');
const router = express.Router();
const pool = require('./db.js');

// GET - Obtener todos los IDs ordenados por lugar
router.get('/ids', async (req, res) => {
  try {
    const query = "SELECT id FROM android_mysql.reservar_areas ORDER BY lugar;";
    const result = await pool.query(query);

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows });
    } else {
      res.json({ success: true, message: "No se encontraron IDs" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET - Obtener reservas por ID
router.get('/registro_reservas', async (req, res) => {
  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ success: false, error: "No se proporcionó un ID válido" });
  }

  try {
    const query = "SELECT * FROM android_mysql.reservar_areas WHERE id = $1 ORDER BY lugar ASC";
    const result = await pool.query(query, [id]);

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows });
    } else {
      res.status(404).json({ success: false, message: "No se encontraron reservas para el ID proporcionado" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST - Reportar reserva
router.post('/reportar', async (req, res) => {
  const { profesor, clase, lugar, hora_inicio, hora_final } = req.query;

  if (!profesor || !clase || !lugar || !hora_inicio || !hora_final) {
    return res.status(400).json({ success: false, error: "Faltan datos para completar el registro" });
  }

  try {
    const query = `
      INSERT INTO android_mysql.reportes 
      (profesor, clase, lugar, hora_inicio, hora_final) 
      VALUES ($1, $2, $3, $4, $5)
    `;
    const values = [profesor, clase, lugar, hora_inicio, hora_final];
    await pool.query(query, values);
    res.json({ success: true, message: "Reporte registrado con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Error al registrar el reporte" });
  }
});

// POST - Reservar lugar
router.post('/reservar_lugar', async (req, res) => {
  const { profesor, clase, lugar, hora_inicio, hora_final } = req.query; // Cambiado de req.body a req.query

  if (!profesor || !clase || !lugar || !hora_inicio || !hora_final) {
    return res.status(400).json({ success: false, error: "Faltan datos para completar el registro" });
  }

  try {
    const query = `
      INSERT INTO android_mysql.reservar_areas 
      (profesor, clase, lugar, hora_inicio, hora_final) 
      VALUES ($1, $2, $3, $4, $5)
    `;
    const values = [profesor, clase, lugar, hora_inicio, hora_final];
    await pool.query(query, values);
    res.json({ success: true, message: "Reserva registrada con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Error al registrar la reserva" });
  }
});

module.exports = router;
