import { format, parse } from 'date-fns';
import pool from '../config/db.js';


  export async function createAppointment(
    {
      topic,
      tutor,
      student_id,
      date,
      notes,
      status = 'pending',
      organizacion_id,
    },
    user_id,
    client = pool
  ) {
    const parsedDate = parse(date, 'dd-MM-yyyy HH:mm', new Date());
    const formattedDate = format(parsedDate, 'yyyy-MM-dd HH:mm');

    const query = `
      INSERT INTO appointments (topic, tutor, student_id, user_id, date, notes, status, organizacion_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `;
    await client.query(query, [
      topic,
      tutor,
      student_id,
      user_id,
      formattedDate,
      notes,
      status,
      organizacion_id,
    ]);
  }


export async function getAppointments(
  user_id,
  status,
  organizacion_id,
  client = pool
) {
  const query = `
    SELECT * FROM appointments_details
    WHERE user_id = $1 AND status = $2 AND organizacion_id = $3;
  `;
  const { rows } = await client.query(query, [
    user_id,
    status,
    organizacion_id,
  ]);
  console.log(user_id, status, organizacion_id);
  return rows;
}


export async function updateAppointment({
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

  console.log(id, topic, tutor, date, notes, status, organizacion_id);
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

export async function getTables(organizacion_id, client = pool) {
  const query = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'appointments';
  `;
  const { rows } = await client.query(query);
  return rows.map((row) => ({ name: row.table_name }));
}
