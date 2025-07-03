import pool from '../config/db.js';
import bcrypt from 'bcrypt';
const saltRounds = 10;

// Crear la tabla de estudiantes si no existe
export async function createStudentsTable(client = pool) {
  const query = `
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      personal_id TEXT NOT NULL,
      rh TEXT NOT NULL,
      grade TEXT NOT NULL,
      organizacion_id VARCHAR(255) NOT NULL,
      UNIQUE(personal_id, organizacion_id)
    );
  `;
  await client.query(query);
}

// Buscar estudiante por nombre en una organización
export async function getStudentByName(name, organizacion_id, client = pool) {
  const query = 'SELECT * FROM students WHERE name = $1 AND organizacion_id = $2';
  const { rows } = await client.query(query, [name, organizacion_id]);
  return rows.length > 0 ? rows : null;
}

// Buscar estudiante por ID en una organización
export async function getStudentById(id, organizacion_id, client = pool) {
  const query = 'SELECT * FROM students WHERE id = $1 AND organizacion_id = $2';
  const { rows } = await client.query(query, [id, organizacion_id]);
  return rows.length > 0 ? rows : null;
}

// Agregar un nuevo estudiante
export async function addStudent(studentData, client = pool) {
  const { name, personal_id, rh, grade, organizacion_id } = studentData;
  const query = `
    INSERT INTO students (name, personal_id, rh, grade, organizacion_id)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (personal_id, organizacion_id) DO NOTHING;
  `;
  const result = await client.query(query, [name, personal_id, rh, grade, organizacion_id]);
  return result;
}

// Crear o actualizar un usuario estudiante
export async function upsertStudentUser(userData, client = pool) {
  const { personal_id, name, email, password, grade, organizacion_id } = userData;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const query = `
    INSERT INTO student_users (personal_id, name, email, password, grade, organizacion_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (personal_id) DO UPDATE
    SET name = EXCLUDED.name,
        email = EXCLUDED.email,
        grade = EXCLUDED.grade,
        organizacion_id = EXCLUDED.organizacion_id;
  `;
  await client.query(query, [personal_id, name, email, hashedPassword, grade, organizacion_id]);
}

// Eliminar todos los estudiantes de una organización
export async function deleteStudentsByOrganization(organizacion_id, client = pool) {
  const query = 'DELETE FROM students WHERE organizacion_id = $1';
  await client.query(query, [organizacion_id]);
}
