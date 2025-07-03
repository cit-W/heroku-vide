import pool from '../config/db.js';

// Crear o actualizar departamento
export async function crearDepartamento({ id, nombre, organizacion_id }, client = pool) {
  const query = `
    INSERT INTO departments (id, department, organizacion_id)
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO UPDATE
      SET department = EXCLUDED.department,
          organizacion_id = EXCLUDED.organizacion_id;
  `;
  await client.query(query, [id, nombre, organizacion_id]);
}

// Obtener departamentos por organización
export async function obtenerDepartamentosPorOrganizacion(organizacion_id, client = pool) {
  const query = `
    SELECT department FROM departments
    WHERE organizacion_id = $1
    ORDER BY department;
  `;
  const { rows } = await client.query(query, [organizacion_id]);
  return rows;
}
