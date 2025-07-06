import pool from '../config/db.js';


export async function createDepartment({ id, name, organizacion_id }, client = pool) {
  const query = `
    INSERT INTO departments (id, department, organizacion_id)
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO UPDATE
      SET department = EXCLUDED.department,
          organizacion_id = EXCLUDED.organizacion_id;
  `;
  await client.query(query, [id, name, organizacion_id]);
}


export async function getDepartmentsByOrganization(organizacion_id, client = pool) {
  const query = `
    SELECT department FROM departments
    WHERE organizacion_id = $1
    ORDER BY department;
  `;
  const { rows } = await client.query(query, [organizacion_id]);
  return rows;
}