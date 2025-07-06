import pool from '../config/db.js';

export async function postDevice(email, player_id, device_type, organizacion_id) {
  const query = `INSERT INTO user_devices (email, player_id, device_type, organizacion_id)
        VALUES ($1, $2, $3, $4) RETURNING *;`;
  const { rows } = await pool.query(query, [
    email,
    player_id,
    device_type,
    organizacion_id,
  ]);
  return rows[0];
}

export async function getDevice(email, organizacion_id) {
  const query = `SELECT * FROM user_devices WHERE email = $1 AND organizacion_id = $2`;
  const { rows } = await pool.query(query, [email, organizacion_id]);
  return rows[0];
}

export async function updateDevice(id, device_type, last_active, organizacion_id) {
  let fields = [];
  let values = [];
  let index = 1;

  if (device_type) {
    fields.push(`device_type = $${index}`);
    values.push(device_type);
    index++;
  }
  if (last_active) {
    fields.push(`last_active = $${index}`);
    values.push(last_active);
    index++;
  }
  values.push(id);
  values.push(organizacion_id);

  const query = `UPDATE user_devices SET ${fields.join(
    ', '
  )} WHERE id = $${index} AND organizacion_id = $${index + 1} RETURNING *;`;
  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function deleteDevice(id, organizacion_id) {
  const query = 'DELETE FROM user_devices WHERE id = $1 AND organizacion_id = $2;';
  const result = await pool.query(query, [id, organizacion_id]);
  return result.rowCount > 0;
}

export async function saveDevice({ email, player_id, device_type, organizacion_id }, client = pool) {
  const query = `
            INSERT INTO user_devices (email, player_id, device_type, last_active, organizacion_id)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
            ON CONFLICT (player_id) DO UPDATE
            SET last_active = CURRENT_TIMESTAMP, device_type = EXCLUDED.device_type, organizacion_id = EXCLUDED.organizacion_id;
        `;
  await client.query(query, [email, player_id, device_type, organizacion_id]);
}