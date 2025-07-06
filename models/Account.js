import pool from '../config/db.js';


export async function deletePersonalReservation(id, organizacion_id, client = pool) {
  const query = 'DELETE FROM reservations WHERE id = $1 AND organizacion_id = $2';
  const result = await client.query(query, [id, organizacion_id]);
  return result.rowCount > 0;
}


export async function deletePersonalSocialWork(id, organizacion_id, client = pool) {
  const query = 'DELETE FROM social_work WHERE id = $1 AND organizacion_id = $2';
  const result = await client.query(query, [id, organizacion_id]);
  return result.rowCount > 0;
}


export async function getReservationsByTeacher(teacherId, organizacion_id, client = pool) {
  const query = `
    SELECT id
    FROM reservations
    WHERE user_id = $1 AND organizacion_id = $2
    ORDER BY place
  `;
  const { rows } = await client.query(query, [teacherId, organizacion_id]);
  return rows;
}


export async function getSocialWorksByTeacher(teacherId, organizacion_id, client = pool) {
  const query = `
    SELECT id
    FROM social_work
    WHERE profesor = $1 AND organizacion_id = $2
  `;
  const { rows } = await client.query(query, [teacherId, organizacion_id]);
  return rows;
}
