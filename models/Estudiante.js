import pool from '../config/db.js';

export async function obtenerReservas() {
  const query = 'SELECT * FROM android_mysql.reservar_areas ORDER BY lugar ASC';
  const { rows } = await pool.query(query);
  return rows.length > 0 ? rows : null;
}

export async function obtenerPorNombre(nombre) {
  const query = 'SELECT * FROM android_mysql.id2024sql WHERE nombre = $1';
  const { rows } = await pool.query(query, [nombre]);
  return rows.length > 0 ? rows : null;
}

export async function obtenerPorID(id) {
  const query = 'SELECT * FROM android_mysql.id2024sql WHERE id = $1';
  const { rows } = await pool.query(query, [id]);
  return rows.length > 0 ? rows : null;
}

export async function deleteEstudiantes(id) {
  const query = 'DROP TABLE IF EXISTS horarios_curso.$1';
  await pool.query(query, [id]);
}

export async function createTableStudents(organizacion_id) {
  // Remover caracteres no alfanuméricos (por ejemplo, guiones) para formar un nombre seguro
  const sanitizedOrganizacionId = organizacion_id.replace(/[^a-zA-Z0-9]/g, '');
  const tableName = 'student_' + sanitizedOrganizacionId;
  const query = `
    DROP TABLE IF EXISTS ${tableName} CASCADE;
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      personal_id TEXT NOT NULL,
      rh TEXT NOT NULL,
      grade TEXT NOT NULL,
    );`;
  const result = await pool.query(query);
  return result;
}

export async function agregarEstudiante(name, personal_id, rh, grade, organizacion_id) {
  const sanitizedOrganizacionId = organizacion_id.replace(/[^a-zA-Z0-9]/g, '');
  const tableName = 'student_' + sanitizedOrganizacionId;
  const query =
    `INSERT INTO ${tableName} (
      name, personal_id, rh, grade
    ) VALUES (
      $1, $2, $3, $4
    )`;
  const values = [name, personal_id, rh, grade];
  const result = await pool.query(query, values);
  return result;
}

export async function crearUsuario({
    personal_id,
    name,
    email,
    password,
    grade,
    organizacion_id
  }) {
    // Hasheamos la contraseña de forma asíncrona
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const query = `
        INSERT INTO studentUser (personal_id, name, email, password, grade, organizacion_id)
        VALUES ($1, $2, $3, $4, $5, $6)
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
      grade,
      organizacion_id,
    ]);
  }