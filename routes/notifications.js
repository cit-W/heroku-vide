import express from 'express';
import {
  registerUser,
  sendNotificationByRoles,
  sendNotificationToOrg,
  getNotificationsForUser,
  sendNotificationToPlayer,
  sendNotificationToAll,
} from '../models/Notification.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// --- ENDPOINTS DE NOTIFICACIONES ---

// Endpoint para registrar un dispositivo y asociarlo a un usuario y rol
router.post('/register-user', async (req, res) => {
  const {
    player_id,
    user_id,
    role,
    organizacion_id,
    device_type,
    app_version,
    device_model,
    os_version,
    ip_address,
  } = req.body;

  if (!player_id || !user_id || !role) {
    return res
      .status(400)
      .json({ error: 'Faltan datos (player_id, user_id, role)' });
  }

  try {
    const deviceInfo = {
      user_id,
      player_id,
      organizacion_id,
      role,
      device_type,
      app_version,
      device_model,
      os_version,
      ip_address,
    };

    await registerUser(deviceInfo, player_id, role, organizacion_id);

    res.json({ success: true, message: 'Usuario registrado y tag asignado.' });
    console.log('respuesta enviada');
  } catch (error) {
    console.log('error respuesta enviada');
    console.error('Error al registrar usuario en OneSignal:', error);
    res
      .status(500)
      .json({ success: false, error: 'No se pudo registrar el dispositivo.' });
  }
});

router.post('/send-to-player', async (req, res) => {
  const { title, body, player_id } = req.body; // Se estandariza a 'player_id'
  if (!title || !body || !player_id) {
    return res
      .status(400)
      .json({ error: 'Faltan datos (title, body, player_id)' });
  }
  try {
    const data = await sendNotificationToPlayer(title, body, player_id);
    res.json({ success: true, data });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: 'Error al enviar la notificación.' });
  }
});

// Endpoint para obtener el historial de notificaciones de un usuario
router.get('/history', verifyToken, async (req, res) => {
  const { userId } = req.user;
  const data = await getNotificationsForUser(userId);
  res.json({ success: true, data });
});

// Endpoint para enviar notificaciones basadas en roles dentro de una organización
router.post('/send-by-roles', verifyToken, async (req, res) => {
  const { orgId } = req.user;
  const { title, body, roles } = req.body;
  if (!title || !body || !roles?.length) {
    return res
      .status(400)
      .json({ error: 'Faltan datos (title, body, roles[array])' });
  }
  const data = await sendNotificationByRoles(title, body, roles, orgId);
  res.json({ success: true, data });
});

// Endpoint para enviar notificaciones a todos en una organización
router.post('/send-to-org', verifyToken, async (req, res) => {
  const { orgId } = req.user;
  const { title, body } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Faltan datos (title, body)' });
  }
  const data = await sendNotificationToOrg(title, body, orgId);
  res.json({ success: true, data });
});

router.post('/send-to-all', verifyToken, async (req, res) => {
  // **Recomendación de seguridad:** Verifica si el usuario tiene un rol específico.
  // Ejemplo:
  // if (req.user.role !== 'admin') {
  //   return res.status(403).json({ error: 'Acceso no autorizado. Se requiere rol de administrador.' });
  // }

  const { title, body } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Faltan datos (title, body)' });
  }

  try {
    const data = await sendNotificationToAll(title, body);
    res.json({
      success: true,
      message: 'Notificación programada para enviarse a todos los usuarios.',
      data,
    });
  } catch (error) {
    console.error('Error al enviar notificación masiva:', error);
    res
      .status(500)
      .json({
        success: false,
        error: 'No se pudo enviar la notificación masiva.',
      });
  }
});

export default router;