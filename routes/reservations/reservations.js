import express from 'express';
import Reserva from '../../models/Reserva.js';
import { verifyToken } from '../../middleware/auth.js';
const router = express.Router();

router.get('/ids', verifyToken, async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const data = await Reserva.obtenerreservationsPorOrganizacion(orgId);
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, data: 'Error al obtener los IDs' });
  }
});

router.get('/registro_reservations', async (req, res) => {
  const { id } = req.query;
  if (!id) {
    return res
      .status(400)
      .json({ success: false, data: 'No se proporcionó un ID válido' });
  }
  try {
    const data = await Reserva.obtenerReservaPorId(id);
    if (data) {
      res.json({ success: true, data });
    } else {
      res.status(404).json({ success: false, data: 'Reserva no encontrada' });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, data: 'Error al obtener la reserva' });
  }
});

router.post('/reportar', verifyToken, async (req, res) => {
  const { profesor, clase, lugar, hora_inicio, hora_final } = req.body;
  if (!profesor || !clase || !lugar || !hora_inicio || !hora_final) {
    return res.status(400).json({ success: false, data: 'Faltan datos' });
  }
  try {
    const orgId = req.user.orgId;
    await Reserva.reportarReserva(
      profesor,
      clase,
      lugar,
      hora_inicio,
      hora_final,
      orgId
    );
    res.json({ success: true, data: 'Reporte registrado con éxito' });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, data: 'Error al registrar el reporte' });
  }
});

router.post('/reservar_lugar', verifyToken, async (req, res) => {
  const { profesor, clase, lugar, hora_inicio, hora_final } = req.body;
  if (!profesor || !clase || !lugar || !hora_inicio || !hora_final) {
    return res.status(400).json({ success: false, data: 'Faltan datos' });
  }
  try {
    const orgId = req.user.orgId;
    await Reserva.reservarLugar(
      profesor,
      clase,
      lugar,
      hora_inicio,
      hora_final,
      orgId
    );
    res.json({ success: true, data: 'Reserva registrada con éxito' });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, data: 'Error al registrar la reserva' });
  }
});

router.post('/eliminarExpiradas', async (req, res) => {
  try {
    const result = await Reserva.eliminarExpiradas();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        data: 'Error al eliminar reservations expiradas',
      });
  }
});

router.post('/verificar_reserva', verifyToken, async (req, res) => {
  const { lugar, clase, hora_inicio, hora_final } = req.body;
  if (!lugar || !clase || !hora_inicio || !hora_final) {
    return res.status(400).json({ success: false, data: 'Faltan datos' });
  }
  try {
    const orgId = req.user.orgId;
    const result = await Reserva.verificarDisponibilidad(
      lugar,
      clase,
      hora_inicio,
      hora_final,
      orgId
    );
    res.json({ success: result.disponible, data: result });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        data: 'Error en la verificación de disponibilidad',
      });
  }
});

export default router;