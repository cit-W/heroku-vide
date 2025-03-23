import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
const SECRET_KEY = process.env.SECRET_KEY;

export async function autenticarUsuario(email, password) {
  const query = 'SELECT * FROM users WHERE email = $1';
  const { rows } = await pool.query(query, [email]);

  if (rows.length === 0) {
    return null; // Usuario no encontrado
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return null; // Contraseña incorrecta
  }

  // Genera y devuelve el token
  const token = jwt.sign({
    userId: user.id,
    orgId: user.organizacion_id,
    role: user.role,
    email: user.email
  }, SECRET_KEY, { expiresIn: '2h' });

  return token;
}