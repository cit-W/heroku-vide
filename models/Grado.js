import pool from '../config/db.js';

export async function createGrade({ id, name, organizacion_id }, client = pool) {
  const query = `
    INSERT INTO grades (id, grade, organizacion_id)
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO UPDATE
    SET grade = EXCLUDED.grade,
        organizacion_id = EXCLUDED.organizacion_id;
  `;
  await client.query(query, [id, nombre, organizacion_id]);
}

export async function getGradesByOrganization(organizacion_id, client = pool) {
  const query = `
    SELECT id, grade
    FROM grades
    WHERE organizacion_id = $1
    ORDER BY grade;
  `;
  const { rows } = await client.query(query, [organizacion_id]);
  return rows;
}
