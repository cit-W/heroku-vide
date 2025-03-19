const pool = require("../config/db");

const Reserva = {

    async obtenerIDs() {
        const query = "SELECT id FROM android_mysql.reservar_areas ORDER BY lugar;";
        const { rows } = await pool.query(query);
        return rows;
    },

    async obtenerPorID(id) {
        const query = `
        SELECT id, profesor, clase, lugar,
                hora_inicio AT TIME ZONE 'UTC' AS hora_inicio,
                hora_final AT TIME ZONE 'UTC' AS hora_final
        FROM android_mysql.reservar_areas 
        WHERE id = $1 ORDER BY lugar ASC;
        `;
        const { rows } = await pool.query(query, [id]);
        return rows;
    },

    async reportarReserva(profesor, clase, lugar, hora_inicio, hora_final) {
        const query = `
        INSERT INTO android_mysql.reportes (profesor, clase, lugar, hora_inicio, hora_final)
        VALUES ($1, $2, $3, $4::TIMESTAMPTZ, $5::TIMESTAMPTZ)
        `;
        await pool.query(query, [profesor, clase, lugar, hora_inicio, hora_final]);
    },

    async reservarLugar(profesor, clase, lugar, hora_inicio, hora_final) {
        const query = `
        INSERT INTO android_mysql.reservar_areas (profesor, clase, lugar, hora_inicio, hora_final)
        VALUES ($1, $2, $3, $4::TIMESTAMPTZ, $5::TIMESTAMPTZ)
        `;
        await pool.query(query, [profesor, clase, lugar, hora_inicio, hora_final]);
    },

    async eliminarExpiradas() {
        const query = `
        DELETE FROM android_mysql.reservar_areas
        WHERE hora_final < (NOW() AT TIME ZONE 'America/Bogota')
        RETURNING id;
        `;
        const { rows, rowCount } = await pool.query(query);
        return { deletedCount: rowCount, deletedIds: rows };
    },

    async verificarDisponibilidad(lugar, clase, hora_inicio, hora_final) {
        const queryLugar = `
        SELECT id, profesor, clase, lugar,
                hora_inicio AT TIME ZONE 'UTC' AS hora_inicio,
                hora_final AT TIME ZONE 'UTC' AS hora_final
        FROM android_mysql.reservar_areas
        WHERE lugar = $1 AND (hora_inicio < $3::TIMESTAMPTZ AND hora_final > $2::TIMESTAMPTZ);
        `;
        const resultLugar = await pool.query(queryLugar, [lugar, hora_inicio, hora_final]);
        
        if (resultLugar.rows.length > 0) return { disponible: false, conflictos: resultLugar.rows };

        const queryClase = `
        SELECT id, profesor, clase, lugar,
                hora_inicio AT TIME ZONE 'UTC' AS hora_inicio,
                hora_final AT TIME ZONE 'UTC' AS hora_final
        FROM android_mysql.reservar_areas
        WHERE clase = $1 AND lugar <> $2 AND (hora_inicio < $4::TIMESTAMPTZ AND hora_final > $3::TIMESTAMPTZ);
        `;
        const resultClase = await pool.query(queryClase, [clase, lugar, hora_inicio, hora_final]);

        if (resultClase.rows.length > 0) return { disponible: false, conflictos: resultClase.rows };

        return { disponible: true };
    }

};

module.exports = Reserva;