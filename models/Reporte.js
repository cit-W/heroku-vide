const pool = require("../config/db");

const Reporte = {
    async obtenerIDs() {
        const query = "SELECT id FROM android_mysql.reportes ORDER BY profesor;";
        const { rows } = await pool.query(query);
        return rows;
    },

    async obtenerPorID(id) {
        const query = "SELECT * FROM android_mysql.reportes WHERE id = $1 ORDER BY lugar ASC";
        const { rows } = await pool.query(query, [id]);
        return rows;
    },
};

module.exports = Reporte;