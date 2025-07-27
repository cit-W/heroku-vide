import pool from './db.js';

const createViews = async () => {
  try {
    console.log('🔄 Creando y actualizando todas las vistas...');

    // Vistas con versión dual (Materializada para velocidad, Estándar para tiempo real)
    // ----------------------------------------------------------------------------------

    // 1. Reservas
    await pool.query(`DROP MATERIALIZED VIEW IF EXISTS mview_reservation_details CASCADE;`);
    await pool.query(`CREATE MATERIALIZED VIEW mview_reservation_details AS SELECT r.id, u.name AS user_name, d.department, p.place, r.start, r.finish, r.status, r.organizacion_id, o.name AS organization_name FROM reservations r JOIN users u ON r.user_id = u.id JOIN departments d ON r.department_id = d.id JOIN places p ON r.place_id = p.id JOIN organizations o ON r.organizacion_id = o.id;`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_mview_reservation_details_id ON mview_reservation_details(id);`);
    await pool.query(`CREATE OR REPLACE VIEW view_reservation_details AS SELECT r.id, u.name AS user_name, d.department, p.place, r.start, r.finish, r.status, r.organizacion_id, o.name AS organization_name FROM reservations r JOIN users u ON r.user_id = u.id JOIN departments d ON r.department_id = d.id JOIN places p ON r.place_id = p.id JOIN organizations o ON r.organizacion_id = o.id;`);
    console.log('✅ Vistas de Reservas (dual) creadas.');

    // 2. Trabajo Social
    await pool.query(`DROP MATERIALIZED VIEW IF EXISTS mview_social_work_details CASCADE;`);
    await pool.query(`CREATE MATERIALIZED VIEW mview_social_work_details AS SELECT sw.id, sw.user_id, u.name AS user_name, sw.description, sw.hours, sw.date, sw.status, sw.organizacion_id FROM social_work sw JOIN users u ON sw.user_id = u.id;`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_mview_social_work_details_id ON mview_social_work_details(id);`);
    await pool.query(`CREATE OR REPLACE VIEW view_social_work_details AS SELECT sw.id, sw.user_id, u.name AS user_name, sw.description, sw.hours, sw.date, sw.status, sw.organizacion_id FROM social_work sw JOIN users u ON sw.user_id = u.id;`);
    console.log('✅ Vistas de Trabajo Social (dual) creadas.');

    // 3. Citaciones
    await pool.query(`DROP MATERIALIZED VIEW IF EXISTS mview_appointments_details CASCADE;`);
    await pool.query(`CREATE MATERIALIZED VIEW mview_appointments_details AS SELECT a.id, a.topic, a.tutor, a.date, a.notes, a.status, a.user_id, a.student_id, s.name AS student_name, u.name AS tutor_name, a.organizacion_id FROM appointments a JOIN students s ON a.student_id = s.id JOIN users u ON a.user_id = u.id;`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_mview_appointments_details_id ON mview_appointments_details(id);`);
    await pool.query(`CREATE OR REPLACE VIEW view_appointments_details AS SELECT a.id, a.topic, a.tutor, a.date, a.notes, a.status, a.user_id, a.student_id, s.name AS student_name, u.name AS tutor_name, a.organizacion_id FROM appointments a JOIN students s ON a.student_id = s.id JOIN users u ON a.user_id = u.id;`);
    console.log('✅ Vistas de Citaciones (dual) creadas.');

    // Vistas únicamente Materializadas (para rendimiento general)
    // ----------------------------------------------------------

    await pool.query(`DROP MATERIALIZED VIEW IF EXISTS mview_user_details CASCADE;`);
    await pool.query(`CREATE MATERIALIZED VIEW mview_user_details AS SELECT u.id, u.personal_id, u.name, u.email, r.role_code, r.role_name, d.department, o.name AS organization FROM users u JOIN roles r ON u.role_id = r.id JOIN departments d ON u.department_id = d.id JOIN organizations o ON u.organizacion_id = o.id;`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_mview_user_details_id ON mview_user_details(id);`);
    console.log('✅ Vista Materializada: mview_user_details creada.');

    await pool.query(`DROP MATERIALIZED VIEW IF EXISTS mview_student_user_details CASCADE;`);
    await pool.query(`CREATE MATERIALIZED VIEW mview_student_user_details AS SELECT su.id, su.email, r.role_code, r.role_name, s.student_id, s.name AS student_name, s.rh, d.department, o.name AS organization FROM student_users su JOIN students s ON su.student_id = s.id JOIN departments d ON s.department_id = d.id JOIN organizations o ON s.organizacion_id = o.id JOIN roles r ON su.role_id = r.id;`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_mview_student_user_details_id ON mview_student_user_details(id);`);
    console.log('✅ Vista Materializada: mview_student_user_details creada.');

    await pool.query(`DROP MATERIALIZED VIEW IF EXISTS mview_events_details CASCADE;`);
    await pool.query(`CREATE MATERIALIZED VIEW mview_events_details AS SELECT e.id, e.organization_id, e.tema, e.acargo, e.mediagroup_video, e.mediagroup_sonido, e.fecha, e.descripcion, p.place AS lugar, e.n_semana FROM events e LEFT JOIN places p ON e.place_id = p.id;`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_mview_events_details_id ON mview_events_details(id);`);
    console.log('✅ Vista Materializada: mview_events_details creada.');

    console.log('✨ Todas las vistas han sido creadas o actualizadas correctamente.');
  } catch (error) {
    console.error('❌ Error al crear las vistas:', error);
  }
};

createViews();
