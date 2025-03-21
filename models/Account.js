import pool from "../config/db.js";

export async function eliminarReservaPersonal(id) {
    const query = "DELETE FROM android_mysql.reservar_areas WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
}

export async function eliminarTrabajoSocialPersonal(id) {
    const query = "DELETE FROM android_mysql.trabajo_social WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
}

export async function obtenerReservasPorProfesor(profesor) {
    const query = "SELECT id FROM android_mysql.reservar_areas WHERE profesor = $1 ORDER BY lugar";
    const { rows } = await pool.query(query, [profesor]);
    return rows;
}

export async function obtenerTrabajosSocialesPorProfesor(profesor) {
    const query = "SELECT id FROM android_mysql.trabajo_social WHERE profesor = $1";
    const { rows } = await pool.query(query, [profesor]);
    return rows;
}