import pool from '../config/db.js';

export async function addSocialWork(
  user_id,
  description,
  hours,
  date,
  orgId,
  client = pool
) {
  const query = `INSERT INTO social_work (user_id, description, hours, date, organizacion_id, status)
                  VALUES ($1, $2, $3, $4, $5, 'upcoming')`;
  await client.query(query, [user_id, description, hours, date, orgId]);
}

export async function getSocialWorks(orgId, client = pool) {
  const query = "SELECT * FROM mview_social_work_details WHERE organizacion_id = $1 AND status = 'upcoming'";
  const { rows } = await client.query(query, [orgId]);
  return rows;
}

export async function getSocialWorksByStatus(status, orgId, client = pool) {
  const query = 'SELECT * FROM mview_social_work_details WHERE status = $1 AND organizacion_id = $2';
  const { rows } = await client.query(query, [status, orgId]);
  return rows;
}

export async function getByID(id, orgId, client = pool) {
  const query =
    'SELECT * FROM social_work WHERE id = $1 AND organizacion_id = $2';
  const { rows } = await client.query(query, [id, orgId]);
  return rows.length > 0 ? rows[0] : null; // Devuelve un solo objeto en vez de un array
}

export async function deleteExpired(client = pool) {
  const query = `
    UPDATE social_work
    SET status = 'past'
    WHERE date < (NOW() AT TIME ZONE 'UTC')
    AND status = 'upcoming'
    RETURNING id;
  `;
  const { rows, rowCount } = await client.query(query);
  const updatedIds = rows.map((r) => r.id);
  return { updatedCount: rowCount, updatedIds };
}