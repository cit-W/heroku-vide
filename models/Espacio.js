import pool from '../config/db.js';


export async function createPlace({ id, name, organizacion_id }, client = pool) {
  const query = `
    INSERT INTO places (id, place, organizacion_id)
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO UPDATE
      SET place = EXCLUDED.place,
          organizacion_id = EXCLUDED.organizacion_id;
  `;
  await client.query(query, [id, name, organizacion_id]);
}


export async function getPlacesByOrganization(organizacion_id, client = pool) {
  const query = `
    SELECT place FROM places
    WHERE organizacion_id = $1
    ORDER BY place;
  `;
  const { rows } = await client.query(query, [organizacion_id]);
  return rows;
}