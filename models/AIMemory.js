import pool from '../config/db.js';

export async function saveAIMemory({ user_id, organization_id, role, key, value }, client = pool) {

  const countQuery = `
    SELECT COUNT(*) as count
    FROM ai_memory
    WHERE user_id = $1 AND organization_id = $2 AND role = $3;
  `;
  const countValues = [user_id, organization_id, role];
  const { rows } = await client.query(countQuery, countValues);
  const count = parseInt(rows[0].count, 10);

  if (count >= 10) {
    const deleteQuery = `
      DELETE FROM ai_memory
      WHERE id = (
        SELECT id
        FROM ai_memory
        WHERE user_id = $1 AND organization_id = $2 AND role = $3
        ORDER BY created_at ASC
        LIMIT 1
      );
    `;
    await client.query(deleteQuery, countValues);
  }

  const query = `
    INSERT INTO ai_memory (user_id, organization_id, role, key, value)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id, organization_id, role, key) DO UPDATE
    SET value = EXCLUDED.value, created_at = CURRENT_TIMESTAMP;
  `;
  const values = [user_id, organization_id, role, key, value];
  await client.query(query, values);
}

export async function retrieveAIMemory({ user_id, organization_id, role }, client = pool) {
  const query = `
    SELECT key, value
    FROM ai_memory
    WHERE user_id = $1 AND organization_id = $2 AND role = $3;
  `;
  const values = [user_id, organization_id, role];
  const { rows } = await client.query(query, values);
  console.log(rows);
  return rows;
}
