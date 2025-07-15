import pool from '../config/db.js';

export async function saveAIMemory({ user_id, organization_id, role, key, value }, client = pool) {
  const query = `
    INSERT INTO ai_memory (user_id, organization_id, role, key, value)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id, organization_id, role, key) DO UPDATE
    SET value = EXCLUDED.value, created_at = CURRENT_TIMESTAMP;
  `;
  const values = [user_id, organization_id, role, key, value];
  await client.query(query, values);
}

export async function retrieveAIMemory({ user_id, organization_id, role, key }, client = pool) {
  const query = `
    SELECT value
    FROM ai_memory
    WHERE user_id = $1 AND organization_id = $2 AND role = $3 AND key = $4;
  `;
  const values = [user_id, organization_id, role, key];
  const { rows } = await client.query(query, values);
  return rows.length > 0 ? rows[0].value : null;
}
