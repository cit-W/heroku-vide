const pool = require("../config/db");

const Role = {
    async crearRole({ id, nombre, organizacion_id }) {
        const query = `
        INSERT INTO role (id, nombre, organizacion_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;
        `;
        await pool.query(query, [id, nombre, organizacion_id]);
    },

    async obtenerRolePorOrganizacion(organizacion_id) {
        const query = "SELECT nombre FROM role WHERE organizacion_id = $1 ORDER BY nombre";
        const { rows } = await pool.query(query, [organizacion_id]);
        return rows;
    }
};

module.exports = Role;