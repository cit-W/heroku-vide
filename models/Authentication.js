import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
const SECRET_KEY = process.env.SECRET_KEY;

export async function authenticateUser(email, password, client = pool) {
  try {
    // Busca en ambas tablas en orden
    const tables = ['users', 'student_users'];
    let user = null;

    for (const table of tables) {
      const { rows } = await client.query(
        `SELECT * FROM ${table} WHERE email = $1`,
        [email]
      );
      if (rows.length) {
        user = rows[0];
        break;
      }
    }

    if (!user) return null; // Usuario no encontrado

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null; // Contraseña incorrecta

    const payload = {
      userId: user.id,
      personalId: user.personal_id,
      orgId: user.organizacion_id,
      role: user.role,
      email: user.email,
    };

    return jwt.sign(payload, SECRET_KEY, { expiresIn: '2h' });
  } catch (err) {
    console.error('Error en autenticarUsuario:', err);
    throw new Error('Error interno al autenticar');
  }
}
