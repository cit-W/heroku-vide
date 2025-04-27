import pool from '../config/db.js';

// Crear o actualizar una escuela
export async function crearEscuela({ id, nombre, organizacion_id }) {
  const query = `
    INSERT INTO escuela (id, nombre, organizacion_id)
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO UPDATE
      SET nombre = EXCLUDED.nombre,
          organizacion_id = EXCLUDED.organizacion_id;
  `;
  await pool.query(query, [id, nombre, organizacion_id]);
}

// Obtener escuelas por organización
export async function obtenerEscuelasPorOrganizacion(organizacion_id) {
  const query = `
    SELECT nombre FROM escuela
    WHERE organizacion_id = $1
    ORDER BY nombre;
  `;
  const { rows } = await pool.query(query, [organizacion_id]);
  return rows;
}