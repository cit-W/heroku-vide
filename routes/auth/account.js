import express from 'express';
import { verifyToken } from '../../middleware/auth.js';
import {
  eliminarReservaPersonal,
  eliminarTrabajoSocialPersonal,
  obtenerReservationsPorProfesor,
  obtenerTrabajosSocialesPorProfesor,
} from '../../models/Account.js';
import pool from '../../config/db.js'; // Importar el pool de conexiones

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

router.delete('/delete_reserva_personal/:id', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const success = await eliminarReservaPersonal(req.params.id, orgId, req.dbClient);
    res.json(
      success
        ? { success: true, message: 'Borrado exitosamente' }
        : { success: false, error: 'Error al borrar o el ID no existe' }
    );
  } catch (error) {
    next(error);
  }
});

router.delete('/delete_social_personal', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const success = await eliminarTrabajoSocialPersonal(req.query.id, orgId, req.dbClient);
    res.json(
      success
        ? { success: true, message: 'Borrado exitosamente' }
        : { success: false, error: 'Error al borrar o el ID no existe' }
    );
  } catch (error) {
    next(error);
  }
});

router.get('/reservationsIDs_personal', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const data = await obtenerReservationsPorProfesor(req.query.profesor, orgId, req.dbClient);
    res.json(
      data.length
        ? { success: true, data }
        : {
            success: false,
            message:
              'No se encontraron reservations para el profesor proporcionado',
          }
    );
  } catch (error) {
    next(error);
  }
});

router.get('/socialIDs_personal', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const data = await obtenerTrabajosSocialesPorProfesor(
      req.query.profesor,
      orgId,
      req.dbClient
    );
    res.json(
      data.length
        ? { success: true, data }
        : {
            success: false,
            message:
              'No se encontraron trabajos sociales para el profesor proporcionado',
          }
    );
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
