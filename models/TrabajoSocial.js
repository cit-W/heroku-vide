import pool from '../config/db.js';

export async function agregar(profesor, descripcion, hours, date, orgId, client = pool) {
  const query = `INSERT INTO social_work (name, description, hours, date, organizacion_id)
                  VALUES ($1, $2, $3, $4, $5)`;
  await client.query(query, [profesor, descripcion, hours, date, orgId]);
}

export async function obtenerIDs(orgId, client = pool) {
  const query = 'SELECT id FROM social_work WHERE organizacion_id = $1';
  const { rows } = await client.query(query, [orgId]);
  return rows;
}

export async function obtenerPorID(id, orgId, client = pool) {
  const query =
    'SELECT * FROM social_work WHERE id = $1 AND organizacion_id = $2';
  const { rows } = await client.query(query, [id, orgId]);
  return rows.length > 0 ? rows[0] : null; // Devuelve un solo objeto en vez de un array
}