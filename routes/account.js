const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

router.delete('/delete_reserva_personal', async (req, res) => {
  const id = req.query.id;

  if (!id) {
    return res.status(400).send("No se proporcionó un ID válido");
  }

  try {
    const query = 'DELETE FROM android_mysql.reservar_areas WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rowCount > 0) {
      res.send("Borrado exitosamente");
    } else {
      res.status(404).send("Error al borrar o el ID no existe");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error " + err);
  }
});

router.get('/delete_social_personal', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM personas');
    const personas = result.rows;
    res.render('pages/db', { personas });
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

router.get('/reservasIDs_personal', async (req, res) => {
  const { profesor } = req.query; // Capturamos el parámetro 'profesor' enviado en la URL

  if (!profesor) {
    return res.status(400).send("Se debe proporcionar el nombre del profesor");
  }

  try {
    const client = await pool.connect();

    // Consulta para seleccionar los IDs de reservas donde el campo 'profesor' coincida
    const query = 'SELECT id FROM reservar_areas WHERE profesor = $1 ORDER BY lugar';
    const result = await client.query(query, [profesor]);

    if (result.rows.length > 0) {
      res.json(result.rows); // Enviamos los resultados como JSON
    } else {
      res.send("No hay registros");
    }

    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error " + err);
  }
});

router.get('/socialIDs_personal', async (req, res) => {
  const profesor = req.query.profesor; // Obtiene el parámetro 'profesor' de la URL

  if (!profesor) {
      return res.status(400).send("No se proporcionó un profesor válido");
  }

  try {
      const query = 'SELECT id FROM android_mysql.trabajo_social WHERE profesor = $1';
      const result = await pool.query(query, [profesor]);
      const personas = result.rows;

      res.render('pages/db', { personas });
      client.release();
  } catch (err) {
      console.error(err);
      res.status(500).send("Error " + err);
  }
});

module.exports = router;
