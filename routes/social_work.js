import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { agregar, obtenerIDs, obtenerPorID } from '../models/TrabajoSocial.js';
import pool from '../config/db.js'; // Importar el pool de conexiones

const router = express.Router();

// Middleware para manejar la conexión y el RLS
router.use(verifyToken, async (req, res, next) => {
  const client = await pool.connect();
  try {
    // Establecer la variable de sesión para RLS
    await client.query('SET app.current_org_id = $1', [req.user.orgId]);
    req.dbClient = client; // Adjuntar el cliente a la solicitud
    next();
  } catch (error) {
    client.release(); // Liberar el cliente en caso de error
    next(error);
  }
});

router.post('/add_social_work', async (req, res, next) => {
  const { name, description, hours, date } = req.body;
  const orgId = req.user.orgId;

  if (!name || !description || !hours || !date) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    await agregar(name, description, hours, date, orgId, req.dbClient);
    res.json({ message: 'Trabajo social registrado' });
  } catch (error) {
    next(error);
  }
});

router.get('/ids', async (req, res, next) => {
  const orgId = req.user.orgId;

  try {
    const data = await obtenerIDs(orgId, req.dbClient);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/registro_social_work', async (req, res, next) => {
  const { id } = req.query;
  const orgId = req.user.orgId;

  if (!id) {
    return res.status(400).json({ error: 'ID es requerido' });
  }

  try {
    const data = await obtenerPorID(id, orgId, req.dbClient);

    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: 'Registro no encontrado' });
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Middleware para liberar el cliente después de cada solicitud
router.use((req, res, next) => {
  if (req.dbClient) {
    req.dbClient.release();
  }
  next();
});

export default router;
