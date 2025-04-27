import pool from '../config/db.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// Verifica si hay conexión con la base de datos
export async function verificarConexion() {
  const query = 'SELECT * FROM android_mysql.usuarios';
  const { rows } = await pool.query(query);
  return rows;
}

// Obtiene la info de usuario desde users o student_users
export async function obtenerInfoUsuario(email) {
  try {
    const cacheKey = `usuario_${email.toLowerCase()}`;
    let usuario = cache.get(cacheKey);

    if (!usuario) {
      const query = `
        SELECT personal_id, name, email, role, department, education_level, grade
        FROM user_details
        WHERE email = $1
        UNION
        SELECT student_id::VARCHAR, student_name, email, role, NULL AS department, NULL AS education_level, grade
        FROM student_user_details
        WHERE email = $1
      `;
      const { rows } = await pool.query(query, [email]);

      // Tomamos el primer resultado si hay coincidencia
      usuario = rows.length > 0 ? rows[0] : null;
      if (usuario) cache.set(cacheKey, usuario);
    }

    return usuario;
  } catch (error) {
    console.error('Error en obtenerInfoUsuario:', error);
    throw new Error('Error interno al obtener información de usuario');
  }
}