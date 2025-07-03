import express from 'express';
import { verifyToken } from '../../middleware/auth.js';
import Reservation from '../../models/Reserva.js';
import pool from '../../config/db.js'; // Importar el pool de conexiones

const router = express.Router();

// Middleware para manejar la conexión y el RLS
router.use(verifyToken, async (req, res, next) => {
  const client = await pool.connect();
  try {
    // Establecer la variable de sesión para RLS
    await client.query(`SET app.current_org_id = '${req.user.orgId}'`);
    req.dbClient = client; // Adjuntar el cliente a la solicitud
    next();
  } catch (error) {
    client.release(); // Liberar el cliente en caso de error
    next(error);
  }
});

router.get('/get-reservation-ids', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const data = await Reservation.getReservationsByOrganization(
      orgId,
      req.dbClient
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/get-reservation-record', async (req, res, next) => {
  const { id } = req.query;
  if (!id) {
    return res
      .status(400)
      .json({ success: false, data: 'No se proporcionó un ID válido' });
  }
  try {
    const data = await Reservation.getReservationById(id, req.dbClient);
    if (data) {
      res.json({ success: true, data });
    } else {
      res.status(404).json({ success: false, data: 'Reserva no encontrada' });
    }
  } catch (error) {
    next(error);
  }
});

router.post('/report-reservation', async (req, res, next) => {
  const { clase, lugar, hora_inicio, hora_final } = req.body;
  if (!clase || !lugar || !hora_inicio || !hora_final) {
    return res.status(400).json({ success: false, data: 'Faltan datos' });
  }
  try {
    const orgId = req.user.orgId;
    const userId = req.user.userId; // Obtener userId del token
    await Reservation.reportReservation(
      userId, // Pasar userId en lugar de profesor
      clase,
      lugar,
      hora_inicio,
      hora_final,
      orgId,
      req.dbClient
    );
    res.json({ success: true, data: 'Reporte registrado con éxito' });
  } catch (error) {
    next(error);
  }
});

router.post('/book-place', async (req, res, next) => {
  const { clase, lugar, hora_inicio, hora_final } = req.body;
  if (!clase || !lugar || !hora_inicio || !hora_final) {
    return res.status(400).json({ success: false, data: 'Faltan datos' });
  }
  try {
    const orgId = req.user.orgId;
    const userId = req.user.userId; // Obtener userId del token
    await Reservation.bookPlace(
      userId, // Pasar userId en lugar de profesor
      clase,
      lugar,
      hora_inicio,
      hora_final,
      orgId,
      req.dbClient
    );
    res.json({ success: true, data: 'Reserva registrada con éxito' });
  } catch (error) {
    next(error);
  }
});

router.post('/delete-expired-reservations', async (req, res, next) => {
  try {
    // Esta función no necesita orgId, pero si la tabla reservations tiene RLS,
    // esta operación solo afectará las reservas de la organización del usuario que la ejecuta.
    const result = await Reservation.deleteExpired(req.dbClient);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/check-reservation-availability', async (req, res, next) => {
  const { lugar, clase, hora_inicio, hora_final } = req.body;
  if (!lugar || !clase || !hora_inicio || !hora_final) {
    return res.status(400).json({ success: false, data: 'Faltan datos' });
  }
  try {
    const orgId = req.user.orgId;
    const result = await Reservation.checkAvailability(
      lugar,
      clase,
      hora_inicio,
      hora_final,
      orgId,
      req.dbClient
    );
    res.json({ success: result.disponible, data: result });
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
