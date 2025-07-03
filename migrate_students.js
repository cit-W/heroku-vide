import pool from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function migrateStudentTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get all dynamic student tables
    const { rows: dynamicTables } = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'student_u%';"
    );

    for (const table of dynamicTables) {
      const tableName = table.tablename;
      // Extract organizacion_id from table name (e.g., 'student_org123' -> 'org123')
      const organizacion_id = tableName.replace('student_', '');

      console.log(`Migrating data from ${tableName} for organization ${organizacion_id}...`);

      // 2. Insert data into the 'students' table
      // Using ON CONFLICT DO NOTHING to handle potential duplicates if personal_id and organizacion_id are already present
      const insertQuery = `
        INSERT INTO students (name, personal_id, rh, grade, organizacion_id)
        SELECT name, personal_id, rh, grade, $1 AS organizacion_id
        FROM "${tableName}"
        ON CONFLICT (personal_id, organizacion_id) DO NOTHING;
      `;
      await client.query(insertQuery, [organizacion_id]);
      console.log(`Data from ${tableName} migrated successfully.`);

      // 3. Drop the dynamic table after migration
      const dropTableQuery = `DROP TABLE IF EXISTS "${tableName}" CASCADE;`;
      await client.query(dropTableQuery);
      console.log(`Table ${tableName} dropped.`);
    }

    await client.query('COMMIT');
    console.log('All dynamic student tables migrated successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during migration:', error);
  } finally {
    client.release();
  }
}

migrateStudentTables();
