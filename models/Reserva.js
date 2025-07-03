import pool from '../config/db.js';
import resolveNamesToIds from './resolveNamesToIds.js';

const Reservation = {
  async getReservationsByOrganization(organizacion_id, client = pool) {
    // Asumiendo que reservation_details ahora incluye user_name
    const query =
      'SELECT * FROM reservation_details WHERE organizacion_id = $1 ORDER BY place;';
    const { rows } = await client.query(query, [organizacion_id]);
    return rows;
  },

  async getReservationById(id, client = pool) {
    // Asumiendo que reservation_details ahora incluye user_name
    const query = 'SELECT * FROM reservation_details WHERE id = $1;';
    const { rows } = await client.query(query, [id]);

    if (rows.length === 0) {
      throw new Error(`❌ No se encontró ninguna reserva con ID: ${id}`);
    }

    return rows[0];
  },

  async reportReservation(
    user_id, // Cambiado de name a user_id
    grade,
    place,
    start,
    finish,
    organizacion_id,
    client = pool
  ) {
    const { grade_id, place_id } = await resolveNamesToIds(
      {
        grade,
        place,
        organizacion_id,
      },
      client
    );
    const query = `
    INSERT INTO report_place
      (user_id, grade_id, place_id, start, finish, organizacion_id)
    VALUES
      ($1, $2, $3, $4::TIMESTAMPTZ, $5::TIMESTAMPTZ, $6);
  `;
    await client.query(query, [
      user_id, // Usar user_id
      grade_id,
      place_id,
      start,
      finish,
      organizacion_id,
    ]);
  },

  async bookPlace(
    user_id, // Cambiado de name a user_id
    grade,
    place,
    start,
    finish,
    organizacion_id,
    client = pool
  ) {
    const { grade_id, place_id } = await resolveNamesToIds(
      {
        grade,
        place,
        organizacion_id,
      },
      client
    );

    const insertQuery = `
    INSERT INTO reservations (user_id, grade_id, place_id, start, finish, organizacion_id)
    VALUES ($1, $2, $3, $4::TIMESTAMPTZ, $5::TIMESTAMPTZ, $6)
    RETURNING *;
  `;

    const { rows } = await client.query(insertQuery, [
      user_id, // Usar user_id
      grade_id,
      place_id,
      start,
      finish,
      organizacion_id,
    ]);

    return rows[0];
  },

  async deleteExpired(client = pool) {
    const query = `
    DELETE FROM reservations
    WHERE finish < (NOW() AT TIME ZONE 'UTC')
    RETURNING id;
  `;
    const { rows, rowCount } = await client.query(query);
    const deletedIds = rows.map((r) => r.id);
    return { deletedCount: rowCount, deletedIds };
  },

  async checkAvailability(
    place,
    grade,
    hora_inicio,
    hora_final,
    organizacion_id,
    client = pool
  ) {
    const { grade_id, place_id } = await resolveNamesToIds(
      {
        grade,
        place,
        organizacion_id,
      },
      client
    );

    const queryLugar = `
      SELECT * FROM reservation_details
      WHERE place_id = $1
      AND organizacion_id = $2
      AND (
        start < $3::TIMESTAMPTZ AND finish > $4::TIMESTAMPTZ
      );
    `;
    const resultLugar = await client.query(queryLugar, [
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
    const resultClase = await client.query(queryClase, [
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

export default Reservation;