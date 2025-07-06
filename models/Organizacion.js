import pool from '../config/db.js';

export async function createOrganization({
  id,
  name,
  contact,
  statusId,
  expiresAt,
}) {
  const query = `
        INSERT INTO organizations (id, name, contact, status_id, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, contact = EXCLUDED.contact, status_id = EXCLUDED.status_id, expires_at = EXCLUDED.expires_at;
        `;
  await pool.query(query, [id, name, contact, statusId, expiresAt]);
}

export async function getOrganizations() {
  const query = 'SELECT * FROM organizations ORDER BY name';
  const { rows } = await pool.query(query);
  return rows;
}