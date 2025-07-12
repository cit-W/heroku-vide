import pool from '../config/db.js';
import NodeCache from 'node-cache';

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
      AND word_similarity(name, $2) > 0.12
    ORDER BY similarity(name, $2) DESC;
  `;
  const dbResult = await pool.query(query, [organizacion_id, search]);
  return dbResult.rows;
}

export async function findStudentInGradeFuzzy(
  searchText,
  gradeName,
  orgId,
  client = pool
) {
  const query = `
    SELECT u.id, u.name
    FROM students u
    JOIN grades g ON u.grade_id = g.id
    WHERE u.organizacion_id = $1
      AND g.grade ILIKE $2
      AND word_similarity(u.name, $3) > 0.12
    ORDER BY similarity(u.name, $3) DESC;
  `;
  const { rows } = await client.query(query, [
    orgId,
    `%${gradeName}%`,
    searchText,
  ]);
  console.log(`%${gradeName}%`);
  return rows;
}
