const pool = require("../config/db");

const TrabajoSocial = {
    async agregar(profesor, descripcion, cantidad_horas, cuando) {
        const query = `INSERT INTO android_mysql.trabajo_social (profesor, descripcion, cantidad_horas, cuando) 
                    VALUES ($1, $2, $3, $4)`;
        await pool.query(query, [profesor, descripcion, cantidad_horas, cuando]);
    },

    async obtenerIDs() {
        const query = "SELECT id FROM android_mysql.trabajo_social";
        const { rows } = await pool.query(query);
        return rows.length > 0 ? rows : null;
    },

    async obtenerPorID(id) {
        const query = "SELECT * FROM android_mysql.trabajo_social WHERE id = $1 ORDER BY descripcion ASC";
        const { rows } = await pool.query(query, [id]);
        return rows.length > 0 ? rows : null;
    },
};

module.exports = TrabajoSocial;