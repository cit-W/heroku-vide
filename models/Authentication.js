import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';

const SECRET_KEY = process.env.SECRET_KEY;

export async function authenticateUser(email, password, client = pool) {
  try {
    let user = null;

    // Search in users table
    const userResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if (userResult.rows.length > 0) {
      user = userResult.rows[0];
    } else {
      // Search in student_users table
      const studentUserResult = await client.query(
        'SELECT * FROM student_users WHERE email = $1',
        [email]
      );
      if (studentUserResult.rows.length > 0) {
        user = studentUserResult.rows[0];
      }
    }

    if (!user) return null;

    if (!user.email_verified) {
      throw new Error('Please verify your email before logging in.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    const payload = {
      userId: user.id,
      personalId: user.personal_id,
      orgId: user.organizacion_id,
      role: user.role,
      email: user.email,
    };

    return jwt.sign(payload, SECRET_KEY, { expiresIn: '2h', algorithm: 'HS256' });
  } catch (err) {
    console.error('Error en autenticarUsuario:', err);
    throw new Error('Error interno al autenticar');
  }
}