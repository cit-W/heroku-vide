import pool from "../config/db.js";

export async function obtenerReservas() {
        const query = "SELECT * FROM android_mysql.reservar_areas ORDER BY lugar ASC";
        const { rows } = await pool.query(query);
        return rows.length > 0 ? rows : null;
}

export async function obtenerPorNombre(nombre) {
        const query = "SELECT * FROM android_mysql.id2024sql WHERE nombre = $1";
        const { rows } = await pool.query(query, [nombre]);
        return rows.length > 0 ? rows : null;
}

export async function obtenerPorID(id) {
        const query = "SELECT * FROM android_mysql.id2024sql WHERE id = $1";
        const { rows } = await pool.query(query, [id]);
        return rows.length > 0 ? rows : null;
}

export async function agregarEstudiante(id) {
        const query = "DROP TABLE IF EXISTS horarios_curso.$1";
        await pool.query(query, [id]);
}