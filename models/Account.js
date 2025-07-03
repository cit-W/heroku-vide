import pool from '../config/db.js';

// Elimina una reserva de la tabla reservations
export async function eliminarReservaPersonal(id) {
  const query = 'DELETE FROM reservations WHERE id = $1';
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
export async function obtenerReservationsPorProfesor(profesor) {
  const query = `
    SELECT id
    FROM reservations
    WHERE user_id = $1
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