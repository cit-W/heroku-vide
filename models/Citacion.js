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
  organizacion_id,
}, client = pool) {
  const parsedDate = parse(date, 'dd-MM-yyyy HH:mm', new Date());
  const formattedDate = format(parsedDate, 'yyyy-MM-dd HH:mm');

  const query = `
    INSERT INTO appointments (topic, tutor, student_id, name, date, notes, status, organizacion_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
  `;
  await client.query(query, [
    topic,
    tutor,
    student_id,
    name,
    formattedDate,
    notes,
    status,
    organizacion_id,
  ]);
}

// Obtener citas por nombre y estado
export async function obtenerCitas(name, status, organizacion_id, client = pool) {
  const query = `
    SELECT * FROM appointments
    WHERE name = $1 AND status = $2 AND organizacion_id = $3;
  `;
  const { rows } = await client.query(query, [name, status, organizacion_id]);
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
  organizacion_id,
}, client = pool) {
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
  values.push(organizacion_id);

  const query = `
    UPDATE appointments
    SET ${updateFields.join(', ')}
    WHERE id = $${counter} AND organizacion_id = $${counter + 1};
  `;
  await client.query(query, values);
}

export async function obtenerTablas(organizacion_id, client = pool) {
  const query = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'appointments' AND table_catalog = $1;
  `;
  const { rows } = await client.query(query, [organizacion_id]);
  return rows.map((row) => ({ name: row.table_name }));
}