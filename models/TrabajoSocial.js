import pool from "../config/db.js";

export async function agregar(profesor, descripcion, cantidad_horas, cuando) {
        const query = `INSERT INTO android_mysql.trabajo_social (profesor, descripcion, cantidad_horas, cuando) 
                        VALUES ($1, $2, $3, $4)`;
        await pool(query, [profesor, descripcion, cantidad_horas, cuando]);
}

export async function obtenerIDs() {
        const query = "SELECT id FROM android_mysql.trabajo_social";
        const { rows } = await pool(query);
        return rows.length > 0 ? rows : null;
}

export async function obtenerPorID(id) {
        const query = "SELECT * FROM android_mysql.trabajo_social WHERE id = $1 ORDER BY descripcion ASC";
        const { rows } = await pool(query, [id]);
        return rows.length > 0 ? rows : null;
}