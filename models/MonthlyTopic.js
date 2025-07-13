import pool from '../config/db.js';

export async function getMonthlyTopic(organization_id, year, month, client = pool) {
  const query = `
    SELECT topic
    FROM monthly_topics
    WHERE organization_id = $1 AND year = $2 AND month = $3;
  `;
  const { rows } = await client.query(query, [organization_id, year, month]);
  return rows[0];
}

export async function setMonthlyTopic(organization_id, year, month, topic, client = pool) {
  const query = `
    INSERT INTO monthly_topics (organization_id, year, month, topic)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (organization_id, year, month) DO UPDATE
    SET topic = EXCLUDED.topic;
  `;
  await client.query(query, [organization_id, year, month, topic]);
}
