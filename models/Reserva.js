const pool = require("./db");

const Reserva = {
    async obtenerReservasPorOrganizacion(organizacion_id) {
        const query = "SELECT * FROM reserva WHERE organizacion_id = $1 ORDER BY place;";
        const { rows } = await pool.query(query, [organizacion_id]);
        return rows;
    },

    async obtenerReservaPorId(id) {
        const query = "SELECT * FROM reserva WHERE id = $1 ORDER BY place ASC;";
        const { rows } = await pool.query(query, [id]);
        // Si se busca por id (único), se puede retornar el primer elemento:
        return rows[0];
    },

    async reportarReserva(name, grade, place, start, finish, organizacion_id) {
        const query = `
        INSERT INTO reporte_lugar (name, grade, place, start, finish, organizacion_id)
        VALUES ($1, $2, $3, $4::TIMESTAMPTZ, $5::TIMESTAMPTZ, $6);
        `;
        await pool.query(query, [name, grade, place, start, finish, organizacion_id]);
    },

    async reservarLugar(name, grade, place, start, finish, organizacion_id) {
        const query = `
        INSERT INTO reserva (name, grade, place, start, finish, organizacion_id)
        VALUES ($1, $2, $3, $4::TIMESTAMPTZ, $5::TIMESTAMPTZ, $6);
        `;
        await pool.query(query, [name, grade, place, start, finish, organizacion_id]);
    },

    async eliminarExpiradas() {
        const query = `
        DELETE FROM reserva
        WHERE finish < (NOW() AT TIME ZONE 'America/Bogota')
        RETURNING id;
        `;
        const { rows, rowCount } = await pool.query(query);
        return { deletedCount: rowCount, deletedIds: rows };
    },

    async verificarDisponibilidad(place, grade, start, finish, organizacion_id) {
        const queryLugar = `
        SELECT * FROM reserva
        WHERE place = $1 AND (start < $3::TIMESTAMPTZ AND finish > $2::TIMESTAMPTZ) AND organizacion_id = $4;
        `;
        const resultLugar = await pool.query(queryLugar, [place, start, finish, organizacion_id]);
        if (resultLugar.rows.length > 0)
        return { disponible: false, conflictos: resultLugar.rows };

        const queryClase = `
        SELECT * FROM reserva
        WHERE grade = $1 AND place <> $2 AND (start < $4::TIMESTAMPTZ AND finish > $3::TIMESTAMPTZ) AND organizacion_id = $4;
        `;
        const resultClase = await pool.query(queryClase, [grade, place, start, finish, organizacion_id]);
        if (resultClase.rows.length > 0)
        return { disponible: false, conflictos: resultClase.rows };

        return { disponible: true };
    },
};

module.exports = Reserva;