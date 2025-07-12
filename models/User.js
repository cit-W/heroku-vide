import pool from '../config/db.js';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';
import { transporter } from '../config/mailer.js';

const saltRounds = 10; // Número de iteraciones para generar la sal

const User = {
  async createUser({
    personal_id,
    name,
    email,
    password,
    organizacion_id,
    role_id,
    department_id,
    education_levels_id,
    grade_id,
  }, client = pool) {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationTokenExpiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    const query = `
        INSERT INTO users (personal_id, name, email, password, organizacion_id, role_id, department_id, education_levels_id, grade_id, email_verification_token, email_verification_token_expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (personal_id) DO UPDATE
        SET name = EXCLUDED.name, email = EXCLUDED.email, role_id = EXCLUDED.role_id, department_id = EXCLUDED.department_id,
            education_levels_id = EXCLUDED.education_levels_id, grade_id = EXCLUDED.grade_id;
        `;
    await client.query(query, [
      personal_id,
      name,
      email,
      hashedPassword,
      organizacion_id,
      role_id,
      department_id,
      education_levels_id,
      grade_id,
      emailVerificationToken,
      emailVerificationTokenExpiresAt,
    ]);

    // Send verification email
    const verificationUrl = `http://localhost:3000/auth/verify-email?token=${emailVerificationToken}`;
    const mailOptions = {
      from: '"Your App Name" <no-reply@yourapp.com>',
      to: email,
      subject: 'Email Verification',
      text: `Please verify your email by clicking the following link: ${verificationUrl}`,
      html: `<p>Please verify your email by clicking the following link: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
    };

    await transporter.sendMail(mailOptions);
  },

  async getUsersByOrganization(organizacion_id, client = pool) {
    const query =
      'SELECT * FROM users WHERE organizacion_id = $1 ORDER BY name';
    const { rows } = await client.query(query, [organizacion_id]);
    return rows;
  },

  async getOrgId(email, client = pool) {
    const query = 'SELECT organizacion_id FROM users WHERE email = $1';
    const { rows } = await client.query(query, [email]);
    return rows;
  },

  async getUserById(id, organizacion_id, client = pool) {
    const query = 'SELECT id, name, email, organizacion_id, role_id FROM users WHERE id = $1 AND organizacion_id = $2';
    const { rows } = await client.query(query, [id, organizacion_id]);
    return rows.length > 0 ? rows[0] : null;
  },
};

export default User;

User.verifyEmail = async function(token, client = pool) {
  const { rows } = await client.query(
    'SELECT * FROM users WHERE email_verification_token = $1 AND email_verification_token_expires_at > NOW()',
    [token]
  );

  if (rows.length === 0) {
    return null;
  }

  const user = rows[0];

  await client.query(
    'UPDATE users SET email_verified = TRUE, email_verification_token = NULL, email_verification_token_expires_at = NULL WHERE id = $1',
    [user.id]
  );

  return user;
};
