const express = require("express");
const router = express.Router();
const pool = require("../db.js");
const { ValidationError, DatabaseError, NotFoundError } = require("../middleware/errorHandler");

// Middleware para asegurarnos de que los datos vienen en JSON
router.use(express.json());

// 📌 GET - Obtener todos los IDs ordenados por lugar
router.get("/ids", async (req, res, next) => {
  try {
    const query = "SELECT id FROM android_mysql.reservar_areas ORDER BY lugar;";
    const result = await pool.query(query);

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows });
    } else {
      throw new NotFoundError("No se encontraron reservas");
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// 📌 GET - Obtener reservas por ID
router.get("/registro_reservas", async (req, res) => {
  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ success: false, error: "No se proporcionó un ID válido" });
  }

  try {
    const query = `
      SELECT id, profesor, clase, lugar, 
             hora_inicio AT TIME ZONE 'UTC' AS hora_inicio, 
             hora_final AT TIME ZONE 'UTC' AS hora_final
      FROM android_mysql.reservar_areas 
      WHERE id = $1 
      ORDER BY lugar ASC;
    `;

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

// 📌 POST - Reportar reserva
router.post("/reportar", async (req, res) => {
  const { profesor, clase, lugar, hora_inicio, hora_final } = req.body;

  if (!profesor || !clase || !lugar || !hora_inicio || !hora_final) {
    return res.status(400).json({ success: false, error: "Faltan datos para completar el registro" });
  }

  try {
    const query = `
      INSERT INTO android_mysql.reportes 
      (profesor, clase, lugar, hora_inicio, hora_final) 
      VALUES ($1, $2, $3, $4::TIMESTAMPTZ, $5::TIMESTAMPTZ)
    `;
    const values = [profesor, clase, lugar, hora_inicio, hora_final];

    await pool.query(query, values);
    res.json({ success: true, message: "Reporte registrado con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Error al registrar el reporte" });
  }
});

// 📌 POST - Reservar lugar
router.post("/reservar_lugar", async (req, res) => {
  const { profesor, clase, lugar, hora_inicio, hora_final } = req.body;

  if (!profesor || !clase || !lugar || !hora_inicio || !hora_final) {
    return res.status(400).json({ success: false, error: "Faltan datos para completar el registro" });
  }

  try {
    const query = `
      INSERT INTO android_mysql.reservar_areas 
      (profesor, clase, lugar, hora_inicio, hora_final) 
      VALUES ($1, $2, $3, $4::TIMESTAMPTZ, $5::TIMESTAMPTZ)
    `;
    const values = [profesor, clase, lugar, hora_inicio, hora_final];

    await pool.query(query, values);
    res.json({ success: true, message: "Reserva registrada con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Error al registrar la reserva" });
  }
});

// Endpoint para eliminar reservas expiradas (según la hora del servidor en UTC)
router.post('/eliminarExpiradas', async (req, res, next) => {
  try {
    // Supongamos que la columna hora_final es de tipo TIMESTAMP WITH TIME ZONE
    // y que se almacena en UTC
    const query = `
      DELETE FROM android_mysql.reservar_areas
      WHERE hora_final < (NOW() AT TIME ZONE 'America/Bogota')
      RETURNING id;
    `;
    const result = await pool.query(query);
    res.json({ success: true, deletedCount: result.rowCount, deletedIds: result.rows });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// 📌 POST - Verificar disponibilidad de reserva y evitar conflictos de lugar y curso
router.post("/verificar_reserva", async (req, res) => {
  const { lugar, clase, hora_inicio, hora_final } = req.body;

  if (!lugar || !clase || !hora_inicio || !hora_final) {
    return res.status(400).json({ 
      success: false, 
      error: "Faltan datos para la verificación (lugar, clase, hora_inicio y hora_final son obligatorios)" 
    });
  }

  try {
    // 1. Verificar si el lugar ya está reservado en ese intervalo
    const queryLugar = `
      SELECT id, profesor, clase, lugar, 
             hora_inicio AT TIME ZONE 'UTC' AS hora_inicio, 
             hora_final AT TIME ZONE 'UTC' AS hora_final
      FROM android_mysql.reservar_areas
      WHERE lugar = $1 
        AND (hora_inicio < $3::TIMESTAMPTZ AND hora_final > $2::TIMESTAMPTZ);
    `;
    const valuesLugar = [lugar, hora_inicio, hora_final];
    const resultLugar = await pool.query(queryLugar, valuesLugar);

    if (resultLugar.rows.length > 0) {
      return res.json({
        success: false,
        message: "El lugar ya está reservado en ese intervalo de tiempo.",
        conflicts: resultLugar.rows,
      });
    }

    // 2. Verificar que el mismo curso no tenga reserva en otro lugar durante ese intervalo
    const queryClase = `
      SELECT id, profesor, clase, lugar, 
             hora_inicio AT TIME ZONE 'UTC' AS hora_inicio, 
             hora_final AT TIME ZONE 'UTC' AS hora_final
      FROM android_mysql.reservar_areas
      WHERE clase = $1 
        AND lugar <> $2 
        AND (hora_inicio < $4::TIMESTAMPTZ AND hora_final > $3::TIMESTAMPTZ);
    `;
    const valuesClase = [clase, lugar, hora_inicio, hora_final];
    const resultClase = await pool.query(queryClase, valuesClase);

    if (resultClase.rows.length > 0) {
      return res.json({
        success: false,
        message: "El curso ya tiene una reserva en otro lugar en ese intervalo de tiempo.",
        conflicts: resultClase.rows,
      });
    }

    // Si no hay conflictos, el lugar y el curso están disponibles
    return res.json({
      success: true,
      message: "El lugar y el curso están disponibles para reservar en ese intervalo de tiempo.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
