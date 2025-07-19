import pool from '../config/db.js';
import bcrypt from 'bcrypt';
const saltRounds = 10;


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


export async function getStudentByName(name, organizacion_id, client = pool) {
  const query = 'SELECT * FROM students WHERE name = $1 AND organizacion_id = $2';
  const { rows } = await client.query(query, [name, organizacion_id]);
  return rows.length > 0 ? rows : null;
}


export async function getStudentById(id, organizacion_id, client = pool) {
  const query = 'SELECT * FROM students WHERE id = $1 AND organizacion_id = $2';
  const { rows } = await client.query(query, [id, organizacion_id]);
  return rows.length > 0 ? rows : null;
}


export async function addStudent(studentData, client = pool) {
  const { name, student_id, rh, grade_id, organizacion_id } = studentData;
  const query = `
    INSERT INTO students (name, student_id, rh, grade_id, organizacion_id)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (student_id) DO NOTHING;
  `;
  const result = await client.query(query, [name, student_id, rh, grade_id, organizacion_id]);
  return result;
}

export async function getStudentsByGrade(grade, organizacion_id, client = pool) {
  const query = 'SELECT * FROM students_details WHERE grade = $1 AND organizacion_id = $2';
  const { rows } = await client.query(query, [grade, organizacion_id]);
  return rows;
}

export async function upsertStudentUser(userData, client = pool) {
  const { personal_id, email, password, role_id, organizacion_id } = userData;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const query = `
    INSERT INTO student_users (student_id, email, password, role_id, organizacion_id)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (student_id) DO UPDATE
    SET email = EXCLUDED.email,
        password = EXCLUDED.password,
        role_id = EXCLUDED.role_id,
        organizacion_id = EXCLUDED.organizacion_id;
  `;
  await client.query(query, [personal_id, email, hashedPassword, role_id, organizacion_id]);
}


export async function deleteStudentsByOrganization(organizacion_id, client = pool) {
  const query = 'DELETE FROM students WHERE organizacion_id = $1';
  await client.query(query, [organizacion_id]);
}

export async function getStudentInfoByName(studentName, orgId, client = pool) {
  const query = `
    SELECT s.name, s.personal_id, s.rh, g.name as grade_name, e.name as school_name
    FROM students s
    LEFT JOIN grados g ON s.grade_id = g.id
    LEFT JOIN escuelas e ON g.escuela_id = e.id
    WHERE s.name ILIKE $1 AND s.organizacion_id = $2;
  `;
  const { rows } = await client.query(query, [studentName, orgId]);
  return rows.length > 0 ? rows[0] : null;
}