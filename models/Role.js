import pool from "../config/db.js";

export async function createRole({ role_code, role_name, organizacion_id }, client = pool) {
    const query = `
        INSERT INTO roles (role_code, role_name, organizacion_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (role_code, organizacion_id) DO UPDATE SET role_name = EXCLUDED.role_name;
    `;
    await client.query(query, [role_code, role_name, organizacion_id]);
}

export async function getRolesByOrganization(organizacion_id, client = pool) {
    const query = "SELECT role_code, role_name FROM roles WHERE organizacion_id = $1 ORDER BY role_code";
    const { rows } = await client.query(query, [organizacion_id]);
    return rows;
}

export async function countRolesByOrganization(organizacion_id, client = pool) {
    const query = "SELECT COUNT(*) FROM roles WHERE organizacion_id = $1";
    const { rows } = await client.query(query, [organizacion_id]);
    return parseInt(rows[0].count, 10);
}
