const express = require('express');
const router = express.Router();
const pool = require('../db.js');

// DELETE - Eliminar reserva personal
router.delete('/delete_reserva_personal/:id', async (req, res) => {
  // Se obtiene el ID desde los parámetros de la ruta
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({ success: false, error: "No se proporcionó un ID válido" });
  }

  try {
    const query = 'DELETE FROM android_mysql.reservar_areas WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rowCount > 0) {
      res.json({ success: true, message: "Borrado exitosamente" });
    } else {
      res.status(404).json({ success: false, error: "Error al borrar o el ID no existe" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE - Eliminar trabajo social personal
router.delete('/delete_social_personal', async (req, res) => {
  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ success: false, error: "No se proporcionó un ID válido" });
  }

  try {
    const query = 'DELETE FROM android_mysql.trabajo_social WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rowCount > 0) {
      res.json({ success: true, message: "Borrado exitosamente" });
    } else {
      res.status(404).json({ success: false, error: "Error al borrar o el ID no existe" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET - Obtener reservas por ID del profesor
router.get('/reservasIDs_personal', async (req, res) => {
  const profesor = req.query.profesor;

  if (!profesor) {
    return res.status(400).json({ success: false, error: "No se proporcionó un profesor válido" });
  }

  try {
    const query = 'SELECT id FROM android_mysql.reservar_areas WHERE profesor = $1 ORDER BY lugar';
    const result = await pool.query(query, [profesor]);

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows });
    } else {
      res.status(404).json({ success: false, message: "No se encontraron reservas para el profesor proporcionado" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET - Obtener IDs de trabajo social por profesor
router.get('/socialIDs_personal', async (req, res) => {
  const profesor = req.query.profesor;

  if (!profesor) {
    return res.status(400).json({ success: false, error: "No se proporcionó un profesor válido" });
  }

  try {
    const query = 'SELECT id FROM android_mysql.trabajo_social WHERE profesor = $1';
    const result = await pool.query(query, [profesor]);

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows });
    } else {
      res.status(404).json({ success: false, message: "No se encontraron trabajos sociales para el profesor proporcionado" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
