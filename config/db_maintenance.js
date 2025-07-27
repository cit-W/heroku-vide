import pool from './db.js';

const materializedViews = [
  'mview_reservation_details',
  'mview_social_work_details',
  'mview_appointments_details',
  'mview_user_details',
  'mview_student_user_details',
  'mview_events_details'
];

export const refreshMaterializedViews = async () => {
  console.log('🔄 Iniciando refresco de vistas materializadas...');
  const client = await pool.connect();
  try {
    for (const view of materializedViews) {
      console.log(`  - Refrescando ${view}...`);
      await client.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${view};`);
      console.log(`  - ✅ ${view} refrescada.`);
    }
    console.log('✨ Todas las vistas materializadas han sido refrescadas.');
  } catch (error) {
    console.error('❌ Error al refrescar las vistas materializadas:', error);
  } finally {
    client.release();
  }
};
