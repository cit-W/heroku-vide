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

    const accessTokenPayload = {
      userId: user.id,
      personalId: user.personal_id,
      orgId: user.organizacion_id,
      role: user.role,
      email: user.email,
    };

    const accessToken = jwt.sign(accessTokenPayload, SECRET_KEY, { expiresIn: '1m', algorithm: 'HS256' });

    const refreshToken = jwt.sign({ userId: user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    await client.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

    return { accessToken, refreshToken };
  } catch (err) {
    console.error('Error en autenticarUsuario:', err);
    throw new Error('Error interno al autenticar');
  }
}

export async function verifyRefreshToken(refreshToken, client = pool) {
  try {
    const { rows } = await client.query('SELECT * FROM users WHERE refresh_token = $1', [refreshToken]);
    if (rows.length === 0) {
      return null;
    }
    const user = rows[0];

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    if (decoded.userId !== user.id) {
      return null;
    }

    const accessTokenPayload = {
      userId: user.id,
      personalId: user.personal_id,
      orgId: user.organizacion_id,
      role: user.role,
      email: user.email,
    };

    const accessToken = jwt.sign(accessTokenPayload, SECRET_KEY, { expiresIn: '1m', algorithm: 'HS256' });

    return accessToken;

  } catch (err) {
    console.error('Error en verifyRefreshToken:', err);
    throw new Error('Error interno al verificar el refresh token');
  }
}