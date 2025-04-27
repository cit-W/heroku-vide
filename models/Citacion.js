import { format, parse } from 'date-fns';
import pool from '../config/db.js';

// Crear nueva cita
export async function crearCita({
  topic,
  tutor,
  student_id,
  name,
  date,
  notes,
  status = 'Pendiente',
}) {
  const parsedDate = parse(date, 'dd-MM-yyyy HH:mm', new Date());
  const formattedDate = format(parsedDate, 'yyyy-MM-dd HH:mm');

  const query = `
    INSERT INTO appointments (topic, tutor, student_id, name, date, notes, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7);
  `;
  await pool.query(query, [
    topic,
    tutor,
    student_id,
    name,
    formattedDate,
    notes,
    status,
  ]);
}

// Obtener citas por nombre y estado
export async function obtenerCitas(name, status) {
  const query = `
    SELECT * FROM appointments
    WHERE name = $1 AND status = $2;
  `;
  const { rows } = await pool.query(query, [name, status]);
  return rows;
}

// Actualizar campos de una cita
export async function actualizarCita({
  id,
  topic,
  tutor,
  date,
  notes,
  status,
}) {
  const updateFields = [];
  const values = [];
  let counter = 1;

  if (topic) {
    updateFields.push(`topic = $${counter++}`);
    values.push(topic);
  }
  if (tutor) {
    updateFields.push(`tutor = $${counter++}`);
    values.push(tutor);
  }
  if (date) {
    const parsedDate = parse(date, 'dd-MM-yyyy HH:mm', new Date());
    const formattedDate = format(parsedDate, 'yyyy-MM-dd HH:mm');
    updateFields.push(`date = $${counter++}`);
    values.push(formattedDate);
  }
  if (notes) {
    updateFields.push(`notes = $${counter++}`);
    values.push(notes);
  }
  if (status) {
    updateFields.push(`status = $${counter++}`);
    values.push(status);
  }

  if (updateFields.length === 0)
    throw new Error('No hay campos para actualizar');

  values.push(id);

  const query = `
    UPDATE appointments
    SET ${updateFields.join(', ')}
    WHERE id = $${counter};
  `;
  await pool.query(query, values);
}

export async function obtenerTablas() {
  const query = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'appointments';
  `;
  const { rows } = await pool.query(query);
  return rows.map((row) => ({ name: row.table_name }));
}