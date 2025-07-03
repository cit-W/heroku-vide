import pool from '../config/db.js';
import NodeCache from 'node-cache';

// Inicializar el caché
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

export async function getNames(organizacion_id) {
  let result = cache.get(`nombres_${organizacion_id}`);
  if (!result) {
    const query = 'SELECT * FROM students WHERE organizacion_id = $1';
    const dbResult = await pool.query(query, [organizacion_id]);
    result = dbResult.rows;
    cache.set(`nombres_${organizacion_id}`, result);
  }
  return result;
}

export async function fuzzySearch(search, organizacion_id) {
  const query = `
    SELECT *
    FROM students
    WHERE organizacion_id = $1
      AND word_similarity(name, $2) > 0.12 -- Umbral de similitud de palabra
    ORDER BY similarity(name, $2) DESC;
  `;
  const dbResult = await pool.query(query, [organizacion_id, search]);
  return dbResult.rows;
}
