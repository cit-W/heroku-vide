import pool from '../config/db.js';

export async function agregar(profesor, descripcion, hours, date, orgId) {
  const query = `INSERT INTO trabajo_social (name, description, hours, date, organizacion_id)
                  VALUES ($1, $2, $3, $4, $5)`;
  await pool.query(query, [profesor, descripcion, hours, date, orgId]);
}

export async function obtenerIDs(orgId) {
  const query = 'SELECT id FROM trabajo_social WHERE organizacion_id = $1';
  const { rows } = await pool.query(query, [orgId]);
  return rows;
}

export async function obtenerPorID(id, orgId) {
  const query = 'SELECT * FROM trabajo_social WHERE id = $1 AND organizacion_id = $2';
  const { rows } = await pool.query(query, [id, orgId]);
  return rows.length > 0 ? rows[0] : null; // Devuelve un solo objeto en vez de un array
}