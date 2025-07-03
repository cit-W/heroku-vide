import pool from '../config/db.js';
import bcrypt from 'bcrypt';
const saltRounds = 10; // Número de iteraciones para generar la sal

const User = {
  async createUser({
    personal_id,
    name,
    email,
    password,
    organizacion_id,
    role,
    departamento,
    escuela,
    curso,
  }, client = pool) {
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
    await client.query(query, [
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
};

export default User;
