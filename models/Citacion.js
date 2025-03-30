import { format, parse } from 'date-fns';
import pool from '../config/db.js';

export async function crearTabla(person) {
  const query = `
        CREATE TABLE IF NOT EXISTS citaciones."${person}" (
                id SERIAL PRIMARY KEY,
                topic VARCHAR(50) NOT NULL,
                tutor VARCHAR(35),
                student_id INTEGER NOT NULL,
                date TIMESTAMP NOT NULL,
                notes TEXT,
                status VARCHAR(20) NOT NULL DEFAULT 'Pendiente'
        );
        `;
  await pool.query(query);
}

export async function crearCita({
  person,
  topic,
  tutor,
  student_id,
  date,
  notes,
  status,
}) {
  const parsedDate = parse(date, 'dd-MM-yyyy HH:mm', new Date());
  const formattedDate = format(parsedDate, 'yyyy-MM-dd HH:mm');

  await this.crearEsquema();
  await this.crearTabla(person);

  const query = `
        INSERT INTO citaciones."${person}" (topic, tutor, student_id, date, notes, status)
        VALUES ($1, $2, $3, $4, $5, $6);
        `;
  await pool.query(query, [
    topic,
    tutor,
    student_id,
    formattedDate,
    notes,
    status,
  ]);
}

export async function obtenerCitas(person, status) {
  // Crear la tabla si no existe con la estructura definida
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS citaciones (
        id SERIAL PRIMARY KEY,
        topic VARCHAR(50) NOT NULL,
        tutor VARCHAR(35),
        student_id INTEGER NOT NULL,
        name VARCHAR(50) NOT NULL,
        date TIMESTAMP NOT NULL,
        notes TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'Pendiente'
    );`;

  // Ejecutar la consulta de creación de tabla
  await pool.query(createTableQuery);

  // Consultar las citas filtradas por name y status
  const selectQuery = `SELECT * FROM citaciones WHERE name = $1 AND status = $2;`;
  const { rows } = await pool.query(selectQuery, [person, status]);

  return rows;
}

export async function actualizarCita({
  person,
  id,
  topic,
  tutor,
  date,
  notes,
  status,
}) {
  let updateFields = [];
  let values = [];
  let counter = 1;

  if (topic) updateFields.push(`topic = $${counter++}`), values.push(topic);
  if (tutor) updateFields.push(`tutor = $${counter++}`), values.push(tutor);
  if (date) {
    const parsedDate = parse(date, 'dd-MM-yyyy HH:mm', new Date());
    const formattedDate = format(parsedDate, 'yyyy-MM-dd HH:mm');
    updateFields.push(`date = $${counter++}`);
    values.push(formattedDate);
  }
  if (notes) updateFields.push(`notes = $${counter++}`), values.push(notes);
  if (status) updateFields.push(`status = $${counter++}`), values.push(status);
  if (updateFields.length === 0)
    throw new Error('No hay campos para actualizar');
  values.push(id);

  const query = `
        UPDATE citaciones."${person}"
        SET ${updateFields.join(', ')}
        WHERE id = $${counter};
        `;
  await pool.query(query, values);
}

export async function obtenerTablas() {
  const query = `
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'citaciones' ORDER BY table_name ASC;
        `;
  const { rows } = await pool.query(query);
  return rows.map((row) => ({ name: row.table_name }));
}
