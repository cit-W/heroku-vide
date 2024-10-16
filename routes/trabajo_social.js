const express = require('express');
const router = express.Router();
const pool = require('./db.js');

// POST - Agregar trabajo social
router.post('/add_trabajo_social', async (req, res) => {
  const { profesor, descripcion, cantidad_horas, cuando } = req.body;

  if (!profesor || !descripcion || !cantidad_horas || !cuando) {
    return res.status(400).json({ success: false, error: "Faltan datos para completar el registro" });
  }

  try {
    const query = `
      INSERT INTO android_mysql.trabajo_social 
      (profesor, descripcion, cantidad_horas, cuando) 
      VALUES ($1, $2, $3, $4)
    `;
    const values = [profesor, descripcion, cantidad_horas, cuando];
    await pool.query(query, values);
    res.json({ success: true, data: "Trabajo social registrado con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Error al registrar el trabajo social" });
  }
});

// GET - Obtener todos los IDs de trabajo social
router.get('/ids_trabajo_social', async (req, res) => {
  try {
    const query = 'SELECT id FROM android_mysql.trabajo_social';
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET - Obtener registros de trabajo social por ID
router.get('/registro_trabajo_social', async (req, res) => {
  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ success: false, error: "No se proporcionó un ID válido" });
  }

  try {
    const query = 'SELECT * FROM android_mysql.trabajo_social WHERE id = $1 ORDER BY descripcion ASC';
    const result = await pool.query(query, [id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
