import pool from "../config/db.js";

export async function crearOrganizacion({ id, name, contact, estado, fecha_vencimiento }) {
        const query = `
        INSERT INTO organizaciones (id, name, contact, estado, fecha_vencimiento)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, contact = EXCLUDED.contact, estado = EXCLUDED.estado, fecha_vencimiento = EXCLUDED.fecha_vencimiento;
        `;
        await pool.query(query, [id, name, contact, estado, fecha_vencimiento]);
    }

export async function obtenerOrganizaciones() {
        const query = "SELECT * FROM organizaciones ORDER BY name";
        const { rows } = await pool.query(query);
        return rows;
}