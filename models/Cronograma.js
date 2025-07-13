import pool from '../config/db.js';

/**
 * Crea un nuevo evento en la base de datos centralizada.
 * @param {object} evento - El objeto del evento a crear.
 * @param {string} evento.tema - El tema o título del evento.
 * @param {string} evento.acargo - La persona o departamento a cargo.
 * @param {string} [evento.mediagroup_video] - URL o identificador del video.
 * @param {string} [evento.mediagroup_sonido] - URL o identificador del sonido.
 * @param {string|Date} evento.fecha - La fecha y hora del evento.
 * @param {string} [evento.descripcion] - Una descripción del evento.
 * @param {string} [evento.place_id] - El ID del lugar donde se realizará el evento.
 * @param {string} organizacion_id - El ID de la organización a la que pertenece el evento.
 * @param {object} [client=pool] - El cliente de base de datos a utilizar.
 * @returns {Promise<object>} El resultado de la inserción de la base de datos.
 */
export async function createEvent(evento, organizacion_id, client = pool) {
  const eventDate = new Date(evento.fecha);
  const isoDate = eventDate.toISOString();

  // Calcula el número de la semana del año
  const oneJan = new Date(eventDate.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((eventDate - oneJan) / (24 * 60 * 60 * 1000));
  const resultWeek = Math.ceil((eventDate.getDay() + 1 + numberOfDays) / 7);

  const query = `
    INSERT INTO events 
      (tema, acargo, mediagroup_video, mediagroup_sonido, fecha, descripcion, place_id, n_semana, organization_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;

  const values = [
    evento.tema,
    evento.acargo,
    evento.mediagroup_video || null,
    evento.mediagroup_sonido || null,
    isoDate,
    evento.descripcion || null,
    evento.place_id || null,
    resultWeek,
    organizacion_id,
  ];

  const result = await client.query(query, values);
  return result.rows[0];
}