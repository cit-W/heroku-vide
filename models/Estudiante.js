const pool = require("../config/db");

const Estudiante = {
    async obtenerReservas() {
        const query = "SELECT * FROM android_mysql.reservar_areas ORDER BY lugar ASC";
        const { rows } = await pool.query(query);
        return rows.length > 0 ? rows : null;
    },

    async obtenerPorNombre(nombre) {
        const query = "SELECT * FROM android_mysql.id2024sql WHERE nombre = $1";
        const { rows } = await pool.query(query, [nombre]);
        return rows.length > 0 ? rows : null;
    },

    async obtenerPorID(id) {
        const query = "SELECT * FROM android_mysql.id2024sql WHERE id = $1";
        const { rows } = await pool.query(query, [id]);
        return rows.length > 0 ? rows : null;
    },

    async agregarEstudiante(id) {
        const query = "DROP TABLE IF EXISTS horarios_curso.$1";
        await pool.query(query, [id]);
    },
};

module.exports = Estudiante;