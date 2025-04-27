import pool from '../config/db.js';
import buscarIdsPorNombres from './buscarIdsPorNombres.js';

const Reserva = {
  async obtenerreservationsPorOrganizacion(organizacion_id) {
    const query =
      'SELECT * FROM reservation_details WHERE organizacion_id = $1 ORDER BY place;';
    const { rows } = await pool.query(query, [organizacion_id]);
    return rows;
  },

  async obtenerReservaPorId(id) {
    const query = 'SELECT * FROM reservation_details WHERE id = $1;';
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      throw new Error(`❌ No se encontró ninguna reserva con ID: ${id}`);
    }

    return rows[0];
  },

  async reportarReserva(name, grade, place, start, finish, organizacion_id) {
    const { grade_id, place_id } = await buscarIdsPorNombres({
      grade,
      place,
      organizacion_id,
    });
    const query = `
    INSERT INTO report_place
      (name, grade_id, place_id, start, finish, organizacion_id)
    VALUES
      ($1, $2, $3, $4::TIMESTAMPTZ, $5::TIMESTAMPTZ, $6);
  `;
    await pool.query(query, [
      name,
      grade_id,
      place_id,
      start,
      finish,
      organizacion_id,
    ]);
  },

  async reservarLugar(name, grade, place, start, finish, organizacion_id) {
    const { grade_id, place_id } = await buscarIdsPorNombres({
      grade,
      place,
      organizacion_id,
    });

    const insertQuery = `
    INSERT INTO reservations (name, grade_id, place_id, start, finish, organizacion_id)
    VALUES ($1, $2, $3, $4::TIMESTAMPTZ, $5::TIMESTAMPTZ, $6)
    RETURNING *;
  `;

    const { rows } = await pool.query(insertQuery, [
      name,
      grade_id,
      place_id,
      start,
      finish,
      organizacion_id,
    ]);

    return rows[0];
  },

  async eliminarExpiradas() {
    const query = `
    DELETE FROM reservations
    WHERE finish < (NOW() AT TIME ZONE 'UTC')
    RETURNING id;
  `;
    const { rows, rowCount } = await pool.query(query);
    const deletedIds = rows.map((r) => r.id);
    return { deletedCount: rowCount, deletedIds };
  },

  async verificarDisponibilidad(
    place,
    grade,
    hora_inicio,
    hora_final,
    organizacion_id
  ) {
    const { grade_id, place_id } = await buscarIdsPorNombres({
      grade,
      place,
      org_id: organizacion_id,
    });

    const queryLugar = `
      SELECT * FROM reservation_details
      WHERE place_id = $1
      AND organizacion_id = $2
      AND (
        start < $3::TIMESTAMPTZ AND finish > $4::TIMESTAMPTZ
      );
    `;
    const resultLugar = await pool.query(queryLugar, [
      place_id,
      organizacion_id,
      hora_final,
      hora_inicio,
    ]);

    if (resultLugar.rows.length > 0) {
      return { disponible: false, conflictos: resultLugar.rows };
    }

    const queryClase = `
      SELECT * FROM reservations
      WHERE grade_id = $1
      AND place_id <> $2
      AND organizacion_id = $3
      AND (
        start < $4::TIMESTAMPTZ AND finish > $5::TIMESTAMPTZ
      );
    `;
    const resultClase = await pool.query(queryClase, [
      grade_id,
      place_id,
      organizacion_id,
      hora_final,
      hora_inicio,
    ]);

    if (resultClase.rows.length > 0) {
      return { disponible: false, conflictos: resultClase.rows };
    }

    return { disponible: true };
  },
};

export default Reserva;