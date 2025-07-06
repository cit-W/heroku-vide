import pool from '../config/db.js';


export async function createEducationLevel({ id, name, organizacion_id }, client = pool) {
  const query = `
    INSERT INTO education_levels (id, level, organizacion_id)
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO UPDATE
      SET level = EXCLUDED.level,
          organizacion_id = EXCLUDED.organizacion_id;
  `;
  await client.query(query, [id, name, organizacion_id]);
}


export async function getEducationLevelsByOrganization(organizacion_id, client = pool) {
  const query = `
    SELECT level FROM education_levels
    WHERE organizacion_id = $1
    ORDER BY level;
  `;
  const { rows } = await client.query(query, [organizacion_id]);
  return rows;
}