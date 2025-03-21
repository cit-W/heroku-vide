import pool from "../config/db.js";

export async function crearRole({ id, nombre, organizacion_id }) {
        const query = `
        INSERT INTO roles (id, nombre, organizacion_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;
        `;
        await pool.query(query, [id, nombre, organizacion_id]);
}

export async function obtenerRolePorOrganizacion(organizacion_id) {
        const query = "SELECT nombre FROM roles WHERE organizacion_id = $1 ORDER BY nombre";
        const { rows } = await pool.query(query, [organizacion_id]);
        return rows;
}