import pool from '../config/db.js';

export async function postDevice(deviceData) {
  const {
    user_id,
    player_id,
    organizacion_id,
    device_type,
    app_version,
    device_model,
    os_version,
    ip_address,
  } = deviceData;

  console.log(
    user_id,
    player_id,
    organizacion_id,
    device_type,
    app_version,
    device_model,
    os_version,
    ip_address
  );

  const query = `INSERT INTO user_devices (user_id, player_id, organizacion_id, device_type, app_version, device_model, os_version, ip_address, last_seen_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP) RETURNING *;`;
  const { rows } = await pool.query(query, [
    user_id,
    player_id,
    organizacion_id,
    device_type,
    app_version,
    device_model,
    os_version,
    ip_address,
  ]);
  return rows[0];
}

export async function getDevice(user_id, organizacion_id) {
  const query = `SELECT * FROM user_devices WHERE user_id = $1 AND organizacion_id = $2`;
  const { rows } = await pool.query(query, [user_id, organizacion_id]);
  return rows;
}

export async function updateDevice(id, updateData) {
  const {
    device_type,
    app_version,
    is_active,
    device_model,
    os_version,
    ip_address,
    organizacion_id,
  } = updateData;

  let fields = [];
  let values = [];
  let index = 1;

  if (device_type) {
    fields.push(`device_type = ${index++}`);
    values.push(device_type);
  }
  if (app_version) {
    fields.push(`app_version = ${index++}`);
    values.push(app_version);
  }
  if (is_active !== undefined) {
    fields.push(`is_active = ${index++}`);
    values.push(is_active);
  }
  if (device_model) {
    fields.push(`device_model = ${index++}`);
    values.push(device_model);
  }
  if (os_version) {
    fields.push(`os_version = ${index++}`);
    values.push(os_version);
  }
  if (ip_address) {
    fields.push(`ip_address = ${index++}`);
    values.push(ip_address);
  }

  fields.push(`last_seen_at = CURRENT_TIMESTAMP`);

  values.push(id);
  values.push(organizacion_id);

  const query = `UPDATE user_devices SET ${fields.join(
    ', '
  )} WHERE id = ${index++} AND organizacion_id = ${index++} RETURNING *;`;
  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function deleteDevice(id, organizacion_id) {
  const query = 'DELETE FROM user_devices WHERE id = $1 AND organizacion_id = $2;';
  const result = await pool.query(query, [id, organizacion_id]);
  return result.rowCount > 0;
}

export async function saveDevice(deviceData, client = pool) {
  const {
    user_id,
    player_id,
    organizacion_id,
    device_type,
    app_version,
    device_model,
    os_version,
    ip_address,
  } = deviceData;

  const query = `
            INSERT INTO user_devices (user_id, player_id, organizacion_id, device_type, app_version, device_model, os_version, ip_address, last_seen_at, created_at, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true)
            ON CONFLICT (player_id) DO UPDATE
            SET last_seen_at = CURRENT_TIMESTAMP,
                device_type = EXCLUDED.device_type,
                app_version = EXCLUDED.app_version,
                device_model = EXCLUDED.device_model,
                os_version = EXCLUDED.os_version,
                ip_address = EXCLUDED.ip_address,
                is_active = true;
        `;
  await client.query(query, [
    user_id,
    player_id,
    organizacion_id,
    device_type,
    app_version,
    device_model,
    os_version,
    ip_address,
  ]);
}
