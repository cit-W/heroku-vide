import pool from "../config/db.js";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

export async function verificarConexion() {
        const query = "SELECT * FROM android_mysql.usuarios";
        const { rows } = await pool.query(query);
        return rows;
}

export async function obtenerInfoUsuario(email) {
  try {
    // Intenta leer del caché
    let usuarios = cache.get('usuarios');
    if (!usuarios) {
      // Obtiene datos de ambas tablas (sin password ni org_id)
      const query = `
        SELECT personal_id, name, email, role, departamento, escuela, curso
        FROM users
        WHERE email = $1
        UNION
        SELECT personal_id, name, email, role, NULL AS departamento, NULL AS escuela, NULL AS curso
        FROM studentUser
        WHERE email = $1
      `;
      const { rows } = await pool.query(query, [email]);
      usuarios = rows;
      cache.set('usuarios', usuarios);
    }

    // Busca el usuario por email (case‑insensitive)
    const usuario = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    return usuario ?? null;
  } catch (error) {
    console.error('Error en obtenerInfoUsuario:', error);
    throw new Error('Error interno al obtener información de usuario');
  }
}