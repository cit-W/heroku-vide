import pool from '../config/db.js';
import * as OneSignal from '@onesignal/node-onesignal';
import { saveDevice } from './UserDevices.js';

const config = OneSignal.createConfiguration({
  authMethods: {
    appKey: process.env.ONE_SIGNAL_API_KEY,
  },
});
const client = new OneSignal.DefaultApi(config);
const APP_ID = process.env.ONE_SIGNAL_APP_ID;

export async function registerUser(email, player_id, role, organizacion_id) {
  await saveDevice({ email, player_id, device_type: role, organizacion_id });

  const player = new OneSignal.UpdatePlayerTagsRequestBody();
  player.tags = { role };
  await client.updatePlayerTags(APP_ID, player_id, player);
}

export async function sendNotification(title, body, role, departamento, nivel) {
  try {
    const filters = [];
    const add = (key, val) => {
      if (filters.length) filters.push({ operator: 'AND' });
      filters.push({ field: 'tag', key, relation: '=', value: val });
    };
    if (role) add('role', role);
    if (departamento) add('departamento', departamento);
    if (nivel) add('nivel', nivel);

    const notification = {
      app_id: APP_ID,
      contents: { en: body, es: body },
      headings: { en: title, es: title },
      filters,
    };

    const response = await client.createNotification(notification);
    return { notification_id: response.id };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

export async function sendNotificationByRoles(title, body, roles, orgId) {
  if (!roles?.length) throw new Error('Debe proporcionar al menos un rol.');

  const filters = roles.flatMap((r, i) => {
    const arr = [{ field: 'tag', key: 'role_level', relation: '=', value: r }];
    if (i < roles.length - 1) arr.push({ operator: 'OR' });
    return arr;
  });

  filters.push(
    { operator: 'AND' },
    { field: 'tag', key: 'org_id', relation: '=', value: orgId }
  );

  const notification = {
    app_id: APP_ID,
    contents: { en: body, es: body },
    headings: { en: title, es: title },
    filters,
  };

  const { id } = await client.createNotification(notification);
  return { notification_id: id };
}

export async function sendNotificationToOrg(title, body, orgId) {
  if (!orgId) throw new Error('Se debe proporcionar orgId.');

  const notification = {
    app_id: APP_ID,
    contents: { en: body, es: body },
    headings: { en: title, es: title },
    filters: [{ field: 'tag', key: 'org_id', relation: '=', value: orgId }],
  };

  const { id } = await client.createNotification(notification);
  return { notification_id: id };
}

export async function sendNotificationToPlayer(title, body, playerId) {
  const notification = {
    app_id: APP_ID,
    contents: { en: body },
    headings: { en: title },
    include_subscription_ids: [playerId], // nuevo nombre del campo
  };

  const { id } = await client.createNotification(notification);
  return { notification_id: id };
}

export async function getNotificationsForUser(userId) {
  const { rows } = await pool.query(
    'SELECT player_id FROM user_devices WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [userId]
  );
  if (!rows.length) return [];

  const filter = `[{"field":"player_id","relation":"=","value":"${rows[0].player_id}"}]`;
  const response = await client.getNotifications(APP_ID, '50', 0, null, filter);
  return response.notifications || [];
}
