import pool from '../config/db.js';

// Elimina una reserva de la tabla reservar_areas (formato android_mysql)
export async function eliminarReservaPersonal(id) {
  const query = 'DELETE FROM android_mysql.reservar_areas WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rowCount > 0;
}

// Elimina un trabajo social por ID
export async function eliminarTrabajoSocialPersonal(id) {
  const query = 'DELETE FROM social_work WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rowCount > 0;
}

// Obtiene solo los IDs de reservas asociadas a un profesor
export async function obtenerreservationsPorProfesor(profesor) {
  const query = `
    SELECT id
    FROM android_mysql.reservar_areas
    WHERE profesor = $1
    ORDER BY lugar
  `;
  const { rows } = await pool.query(query, [profesor]);
  return rows;
}

// Obtiene solo los IDs de trabajos sociales asociados a un profesor
export async function obtenerTrabajosSocialesPorProfesor(profesor) {
  const query = `
    SELECT id
    FROM social_work
    WHERE profesor = $1
  `;
  const { rows } = await pool.query(query, [profesor]);
  return rows;
}