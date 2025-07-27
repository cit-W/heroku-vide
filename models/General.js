import pool from '../config/db.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

export async function checkConnection() {
  const query = 'SELECT 1;';
  const { rows } = await pool.query(query);
  return rows;
}

export async function getPersonal(personalId) {
  try {
    const cacheKey = `personal_${personalId}`;
    let usuario = cache.get(cacheKey);

    if (!usuario) {
      const query = `
        SELECT personal_id::VARCHAR AS personal_id, name, email, role_code, role_name AS role, department, education_level, grade
        FROM mview_user_details
        WHERE personal_id::VARCHAR = $1::text
        UNION
        SELECT student_id::VARCHAR, student_name AS name, email, role_code, role_name AS role, NULL AS department, NULL AS education_level, grade
        FROM mview_student_user_details
        WHERE student_id::VARCHAR = $1::text
      `;

      const { rows } = await pool.query(query, [personalId]);

      usuario = rows.length > 0 ? rows[0] : null;
      if (usuario) cache.set(cacheKey, usuario);
    }

    return usuario;
  } catch (error) {
    console.error('Error en obtenerInfoUsuario:', error);
    throw new Error('Error interno al obtener información de usuario');
  }
}

export async function getUserInfo(email) {
  try {
    const cacheKey = `usuario_${email.toLowerCase()}`;
    let usuario = cache.get(cacheKey);

    if (!usuario) {
      const query = `
        SELECT personal_id, name, email, role_code, role_name AS role, department, education_level, grade
        FROM mview_user_details
        WHERE email = $1
        UNION
        SELECT student_id::VARCHAR, student_name, email, role_code, role_name AS role, NULL AS department, NULL AS education_level, grade
        FROM mview_student_user_details
        WHERE email = $1
      `;
      const { rows } = await pool.query(query, [email]);

      usuario = rows.length > 0 ? rows[0] : null;
      if (usuario) cache.set(cacheKey, usuario);
    }

    return usuario;
  } catch (error) {
    console.error('Error en obtenerInfoUsuario:', error);
    throw new Error('Error interno al obtener información de usuario');
  }
}
