const express = require('express');
const router = express.Router();
const pool = require('../db.js');

// POST - Crear un nuevo usuario
router.post('/create_user', async (req, res) => {
  try {
      // Extraer datos del body
      const { name, cedula, role, nivel, dep, curso } = req.body;

      // Normalizar nombre
      const nameCorrect = name ? name.toLowerCase() : null;

      // Validar que no falten datos
      if (!nameCorrect || !cedula || !role || !nivel || !dep || !curso) {
          return res.status(400).json({ success: false, error: "Faltan datos para completar el registro" });
      }

      // Query 1: Insertar nuevo usuario
      const insertUserQuery = `
          INSERT INTO android_mysql.usuarios 
          (name, cedula, role, nivel, departamento, curso) 
          VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await pool.query(insertUserQuery, [nameCorrect, cedula, role, nivel, dep, curso]);

      // Query 2: Crear esquema si no existe
      const createSchemaQuery = `
          CREATE SCHEMA IF NOT EXISTS citaciones
          AUTHORIZATION u9976s05mfbvrs
      `;
      await pool.query(createSchemaQuery);

      // Query 3: Crear tabla para citaciones del usuario si no existe
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

      res.json({ success: true, message: "Usuario registrado con éxito" });
  } catch (err) {
      console.error("Error en /create_user:", err);
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
