import pool from '../config/db.js';
import resolveNamesToIds from './resolveNamesToIds.js';

const Reservation = {
  async getReservationsByOrganization(organizacion_id, client = pool) {

    const query =
      'SELECT * FROM reservation_details WHERE organizacion_id = $1 ORDER BY place;';
    const { rows } = await client.query(query, [organizacion_id]);
    return rows;
  },

  async getReservationById(id, client = pool) {

    const query = 'SELECT * FROM reservation_details WHERE id = $1;';
    const { rows } = await client.query(query, [id]);

    if (rows.length === 0) {
      throw new Error(`❌ No se encontró ninguna reserva con ID: ${id}`);
    }

    return rows[0];
  },

  async reportReservation(
    user_id,
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
      user_id,
      grade_id,
      place_id,
      start,
      finish,
      organizacion_id,
    ]);
  },

  async bookPlace(
    user_id,
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
      user_id,
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
    UPDATE reservations
    SET status = 'past'
    WHERE finish < (NOW() AT TIME ZONE 'UTC')
    AND status = 'upcoming'
    RETURNING id;
  `;
    const { rows, rowCount } = await client.query(query);
    const updatedIds = rows.map((r) => r.id);
    return { updatedCount: rowCount, updatedIds };
  },

  async checkAvailability(
    place,
    hora_inicio,
    hora_final,
    organizacion_id,
    client = pool
  ) {

    const queryLugar = `
      SELECT * FROM reservation_details
      WHERE place = $1
      AND organizacion_id = $2
      AND (
        start < $3::TIMESTAMPTZ AND finish > $4::TIMESTAMPTZ
      );
    `;
    const resultLugar = await client.query(queryLugar, [
      place,
      organizacion_id,
      hora_final,
      hora_inicio,
    ]);

    if (resultLugar.rows.length > 0) {
      return { disponible: false, conflictos: resultLugar.rows };
    }
    return { disponible: true };
  }
};

export default Reservation;
