import pool from '../config/db.js';
import bcrypt from 'bcrypt';
const saltRounds = 10; // Número de iteraciones para generar la sal

const Usuario = {
  async crearUsuario({
    personal_id,
    name,
    email,
    password,
    organizacion_id,
    role,
    departamento,
    escuela,
    curso,
  }) {
    // Hasheamos la contraseña de forma asíncrona
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const query = `
        INSERT INTO users (personal_id, name, email, password, organizacion_id, role, departamento, escuela, curso)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (personal_id) DO UPDATE
        SET name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role, departamento = EXCLUDED.departamento,
            escuela = EXCLUDED.escuela, curso = EXCLUDED.curso;
        `;
    // Utilizamos el hash de la contraseña en lugar del password en texto claro
    await pool.query(query, [
      personal_id,
      name,
      email,
      hashedPassword,
      organizacion_id,
      role,
      departamento,
      escuela,
      curso,
    ]);
  },

  async saveUserDevices({ personal_id, player_id, device_type }) {
    const query = `
            INSERT INTO user_devices (personal_id, player_id, device_type, last_active)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            ON CONFLICT (player_id) DO UPDATE
            SET last_active = CURRENT_TIMESTAMP, device_type = EXCLUDED.device_type;
        `;
    await pool.query(query, [personal_id, player_id, device_type]);
  },

  async obtenerUsuariosPorOrganizacion(organizacion_id) {
    const query =
      'SELECT * FROM users WHERE organizacion_id = $1 ORDER BY name';
    const { rows } = await pool.query(query, [organizacion_id]);
    return rows;
  },

  async obtenerOrgId(email) {
    let query = 'SELECT organizacion_id FROM users WHERE email = $1';
    let result = await pool.query(query, [email]);

    if (result.rowCount === 0) {
        query = 'SELECT organizacion_id FROM studentUser WHERE email = $1';
        result = await pool.query(query, [email]);
    }

    return result.rows;
  },
}

export default Usuario;