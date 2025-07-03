import pool from '../config/db.js';
import bcrypt from 'bcrypt';
const saltRounds = 10;

// Buscar estudiante por nombre
export async function obtenerPorNombre(nombre, organizacion_id, client = pool) {
  const sanitizedId = organizacion_id.replace(/[^a-zA-Z0-9]/g, '');
  const tableName = `student_${sanitizedId}`;
  const query = `SELECT * FROM ${tableName} WHERE name = $1`;
  const { rows } = await client.query(query, [nombre]);
  return rows.length > 0 ? rows : null;
}

// Buscar estudiante por ID
export async function obtenerPorID(id, organizacion_id, client = pool) {
  const sanitizedId = organizacion_id.replace(/[^a-zA-Z0-9]/g, '');
  const tableName = `student_${sanitizedId}`;
  const query = `SELECT * FROM ${tableName} WHERE id = $1`;
  const { rows } = await client.query(query, [id]);
  return rows.length > 0 ? rows : null;
}

// Eliminar tabla de estudiantes por organización
export async function deleteEstudiantes(organizacion_id, client = pool) {
  const sanitizedId = organizacion_id.replace(/[^a-zA-Z0-9]/g, '');
  const tableName = `student_${sanitizedId}`;
  const query = `DROP TABLE IF EXISTS ${tableName} CASCADE;`;
  await client.query(query);
}

// Crear tabla de estudiantes por organización
export async function createTableStudents(organizacion_id, client = pool) {
  const sanitizedId = organizacion_id.replace(/[^a-zA-Z0-9]/g, '');
  const tableName = `student_${sanitizedId}`;
  const query = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      personal_id TEXT NOT NULL,
      rh TEXT NOT NULL,
      grade TEXT NOT NULL
    );
  `;
  return await client.query(query);
}

// Agregar estudiante a tabla dinámica
export async function agregarEstudiante(
  name,
  personal_id,
  rh,
  grade,
  organizacion_id,
  client = pool
) {
  const sanitizedId = organizacion_id.replace(/[^a-zA-Z0-9]/g, '');
  const tableName = `student_${sanitizedId}`;
  const query = `
    INSERT INTO ${tableName} (name, personal_id, rh, grade)
    VALUES ($1, $2, $3, $4);
  `;
  const result = await client.query(query, [name, personal_id, rh, grade]);
  return result;
}

// Crear o actualizar usuario (estudiante)
export async function crearUsuario({
  personal_id,
  name,
  email,
  password,
  grade,
  organizacion_id,
}, client = pool) {
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
  await client.query(query, [
    personal_id,
    name,
    email,
    hashedPassword,
    grade,
    organizacion_id,
  ]);
}
