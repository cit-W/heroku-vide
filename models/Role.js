import pool from "../config/db.js";

export async function createRole({ id, name, organizacion_id }, client = pool) {
        const query = `
        INSERT INTO roles (id, role, organizacion_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
        `;
        await client.query(query, [id, name, organizacion_id]);
}

export async function getRolesByOrganization(organizacion_id, client = pool) {
        const query = "SELECT role FROM roles WHERE organizacion_id = $1 ORDER BY role";
        const { rows } = await client.query(query, [organizacion_id]);
        return rows;
}