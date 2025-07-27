import express from 'express';
import {
  registerUser,
  sendNotificationByRoles,
  sendNotificationToOrg,
  getNotificationsForUser,
  sendNotificationToPlayer,
} from '../models/Notification.js';
import { verifyToken } from '../middleware/auth.js';
import * as OneSignal from '@onesignal/node-onesignal';

const router = express.Router();

const config = OneSignal.createConfiguration({
  authMethods: {
    app_key: {
      tokenProvider: { getToken: () => process.env.ONESIGNAL_REST_API_KEY },
    },
  },
});
const client = new OneSignal.DefaultApi(config);
const APP_ID = process.env.ONESIGNAL_APP_ID;

router.post('/send', async (req, res) => {
  const { onesignalId, title, body } = req.body;
  if (!onesignalId || !title || !body) {
    return res
      .status(400)
      .json({ error: 'onesignalId, title y body son requeridos' });
  }

  try {
    const notification = new OneSignal.Notification();
    notification.app_id = APP_ID;
    notification.include_player_ids = [onesignalId];
    notification.headings = { en: title };
    notification.contents = { en: body };

    // (Opcional) puedes agregar data u opciones extras:
    // notification.data = { key: 'value' };
    // notification.ios_badgeType = 'Increase';
    // notification.ios_badgeCount = 1;

    const { id } = await client.createNotification(notification);
    return res.status(200).json({ success: true, notificationId: id });
  } catch (err) {
    console.error('OneSignal error:', err);
    return res.status(500).json({
      error: 'Error al enviar la notificación',
      details: err.response?.body || err.message,
    });
  }
});

router.post('/register-user', async (req, res) => {
  const { player_id, user_id, role, organizacion_id } = req.body;
  if (!player_id || !user_id || !role) {
    return res
      .status(400)
      .json({ error: 'Faltan datos (player_id, user_id, role)' });
  }
  await registerUser(user_id, player_id, role, organizacion_id);
  res.json({ success: true, message: 'Usuario registrado y tag asignado.' });
});

router.post('/send-to-player', async (req, res) => {
  const { title, body, playerId, player_id } = req.body;
  const target = playerId || player_id;
  if (!title || !body || !target) {
    return res
      .status(400)
      .json({ error: 'Faltan datos (title, body, playerId)' });
  }
  const data = await sendNotificationToPlayer(title, body, target);
  res.json({ success: true, data });
});

router.get('/history', verifyToken, async (req, res) => {
  const { userId } = req.user;
  const data = await getNotificationsForUser(userId);
  res.json({ success: true, data });
});

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

router.post('/send-to-org', verifyToken, async (req, res) => {
  const { orgId } = req.user;
  const { title, body } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Faltan datos (title, body)' });
  }
  const data = await sendNotificationToOrg(title, body, orgId);
  res.json({ success: true, data });
});

export default router;
