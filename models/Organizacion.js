const pool = require("../config/db");

const Organizacion = {
    async crearOrganizacion({ id, name, contact, status, fecha_vencimiento }) {
        const query = `
        INSERT INTO organizaciones (id, name, contact, status, fecha_vencimiento)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, contact = EXCLUDED.contact, status = EXCLUDED.status, fecha_vencimiento = EXCLUDED.fecha_vencimiento;
        `;
        await pool.query(query, [id, name, contact, status, fecha_vencimiento]);
    },

    async obtenerOrganizaciones() {
        const query = "SELECT * FROM organizaciones ORDER BY name";
        const { rows } = await pool.query(query);
        return rows;
    }
};

module.exports = Organizacion;