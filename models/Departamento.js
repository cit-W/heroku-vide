import pool from "../config/db.js";

export async function crearDepartamento({ id, nombre, organizacion_id }) {
        const query = `
        INSERT INTO departamento (id, nombre, organizacion_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;
        `;
        await pool.query(query, [id, nombre, organizacion_id]);
}

export async function obtenerDepartamentosPorOrganizacion(organizacion_id) {
        const query = "SELECT nombre FROM departamento WHERE organizacion_id = $1 ORDER BY nombre";
        const { rows } = await pool.query(query, [organizacion_id]);
        return rows;
}