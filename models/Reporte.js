import pool from "../config/db.js";

export async function getIDs() {
        const query = "SELECT id FROM reportes ORDER BY profesor;";
        const { rows } = await pool.query(query);
        return rows;
}

export async function getByID(id) {
        const query = "SELECT * FROM reportes WHERE id = $1 ORDER BY lugar ASC";
        const { rows } = await pool.query(query, [id]);
        return rows;
}
