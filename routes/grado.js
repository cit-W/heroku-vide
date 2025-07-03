import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { crearGrado, obtenerGradosPorOrganizacion } from '../models/Grado.js';
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

router.post('/crear_grado', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    await crearGrado({ ...req.body, organizacion_id: orgId }, req.dbClient);
    res.json({ success: true, message: 'Grado creado con éxito' });
  } catch (error) {
    next(error);
  }
});

router.get('/obtener_grados', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const data = await obtenerGradosPorOrganizacion(orgId, req.dbClient);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/obtener_grado_single', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const data = await obtenerGradosPorOrganizacion(orgId, req.dbClient);
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