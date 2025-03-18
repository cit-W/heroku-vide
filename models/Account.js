const pool = require("../config/db");

const Account = {
    async eliminarReservaPersonal(id) {
        const query = "DELETE FROM android_mysql.reservar_areas WHERE id = $1";
        const result = await pool.query(query, [id]);
        return result.rowCount > 0;
    },

    async eliminarTrabajoSocialPersonal(id) {
        const query = "DELETE FROM android_mysql.trabajo_social WHERE id = $1";
        const result = await pool.query(query, [id]);
        return result.rowCount > 0;
    },

    async obtenerReservasPorProfesor(profesor) {
        const query = "SELECT id FROM android_mysql.reservar_areas WHERE profesor = $1 ORDER BY lugar";
        const { rows } = await pool.query(query, [profesor]);
        return rows;
    },

    async obtenerTrabajosSocialesPorProfesor(profesor) {
        const query = "SELECT id FROM android_mysql.trabajo_social WHERE profesor = $1";
        const { rows } = await pool.query(query, [profesor]);
        return rows;
    }
};

module.exports = Account;