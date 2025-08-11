import pool from '../config/db.js';
import * as OneSignal from '@onesignal/node-onesignal';
import { saveDevice } from './UserDevices.js';
import axios from 'axios';

import {
  oneSignalClient,
  ONE_SIGNAL_APP_ID,
} from '../config/oneSignalClient.js';

export async function registerUser(
  deviceInfo,
  player_id,
  role,
  organizacion_id
) {
  console.log('funcion_llamada', 'registerUser');

  // Guarda en BD
  await saveDevice(deviceInfo);

  // Asigna tags en OneSignal
  const player = new OneSignal.UpdatePlayerTagsRequestBody();
  player.tags = { role, org_id: organizacion_id };
  await oneSignalClient.updatePlayer(ONE_SIGNAL_APP_ID, player_id, player);
}


export async function sendNotificationToPlayer(title, body, playerId) {
  const data = {
    app_id: ONE_SIGNAL_APP_ID,
    headings: { en: title, es: title },
    contents: { en: body, es: body },
    include_player_ids: [playerId],
  };

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
  };

  try {
    const response = await axios.post(
      'https://onesignal.com/api/v1/notifications',
      data,
      { headers }
    );
    return { notification_id: response.data.id };
  } catch (error) {
    console.error(
      'Error al enviar notificación con Axios:',
      error.response?.data || error.message
    );
    throw new Error('Fallo al enviar notificación a través de la API de OneSignal.');
  }
}

export async function sendNotificationByRoles(title, body, roles, orgId) {
  if (!roles?.length) throw new Error('Debe proporcionar al menos un rol.');

  const roleFilters = roles.map((role) => ({
    field: 'tag',
    key: 'role',
    relation: '=',
    value: role,
  }));

  const filters = roleFilters.reduce((acc, current, index) => {
    acc.push(current);
    if (index < roleFilters.length - 1) {
      acc.push({ operator: 'OR' });
    }
    return acc;
  }, []);

  filters.push(
    { operator: 'AND' },
    { field: 'tag', key: 'org_id', relation: '=', value: orgId }
  );

  const data = {
    app_id: ONE_SIGNAL_APP_ID,
    headings: { en: title, es: title },
    contents: { en: body, es: body },
    filters,
  };

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
  };

  try {
    const response = await axios.post(
      'https://onesignal.com/api/v1/notifications',
      data,
      { headers }
    );
    return { notification_id: response.data.id };
  } catch (error) {
    console.error(
      'Error al enviar notificación con Axios:',
      error.response?.data || error.message
    );
    throw new Error('Fallo al enviar notificación a través de la API de OneSignal.');
  }
}

export async function sendNotificationToOrg(title, body, orgId) {
  if (!orgId) throw new Error('Se debe proporcionar orgId.');

  const data = {
    app_id: ONE_SIGNAL_APP_ID,
    headings: { en: title, es: title },
    contents: { en: body, es: body },
    filters: [{ field: 'tag', key: 'org_id', relation: '=', value: orgId }],
  };

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
  };

  try {
    const response = await axios.post(
      'https://onesignal.com/api/v1/notifications',
      data,
      { headers }
    );
    return { notification_id: response.data.id };
  } catch (error) {
    console.error(
      'Error al enviar notificación con Axios:',
      error.response?.data || error.message
    );
    throw new Error('Fallo al enviar notificación a través de la API de OneSignal.');
  }
}

export async function getNotificationsForUser(userId) {
  // ADVERTENCIA: La API de OneSignal no permite filtrar el historial de notificaciones
  // por el 'player_id' al que fue enviada. Esta función probablemente no devuelva
  // los resultados esperados.
  // La forma correcta de implementar un historial por usuario es:
  // 1. Almacenar el 'notification_id' y 'user_id' en tu propia base de datos al enviar la notificación.
  // 2. Consultar esa tabla para obtener el historial del usuario.
  const { rows } = await pool.query(
    'SELECT player_id FROM user_devices WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [userId]
  );

  if (!rows.length) return [];

  // Este llamado obtendrá las últimas 50 notificaciones de TODA la app, no solo las del usuario.
  const response = await oneSignalClient.getNotifications(
    ONE_SIGNAL_APP_ID,
    '50',
    '0'
  );
  return response.notifications || [];
}

export async function sendNotificationToAll(title, body) {
  if (!title || !body) {
    throw new Error('El título y el cuerpo del mensaje son requeridos.');
  }

  // 2. Definir los datos y cabeceras como en el cURL que sí funcionó
  const data = {
    app_id: ONE_SIGNAL_APP_ID,
    included_segments: ['Total Subscriptions'], // O usa "Active Subscriptions"
    headings: { en: title, es: title },
    contents: { en: body, es: body },
  };

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`, // <-- La clave es leída desde .env
  };

  try {
    // 3. Realizar la llamada a la API con axios
    const response = await axios.post(
      'https://onesignal.com/api/v1/notifications',
      data,
      { headers: headers }
    );

    console.log('Notificación masiva enviada con éxito:', response.data);
    return { notification_id: response.data.id };
  } catch (error) {
    // Axios envuelve los errores de manera diferente, así que los manejamos así:
    console.error(
      'Error al enviar notificación masiva con Axios:',
      error.response?.data || error.message
    );
    throw new Error(
      'Fallo al enviar notificación a través de la API de OneSignal.'
    );
  }
}