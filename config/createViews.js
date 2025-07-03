import pool from './db.js';

const createViews = async () => {
  try {
    console.log('🔄 Creando vistas para la base de datos...');

    // Vista 1: user_details
    await pool.query(`
      CREATE OR REPLACE VIEW user_details AS
      SELECT
        u.id,
        u.personal_id,
        u.name,
        u.email,
        r.role,
        d.department,
        el.level AS education_level,
        g.grade AS grade,
        o.name AS organization
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN departments d ON u.department_id = d.id
      JOIN education_levels el ON u.education_levels_id = el.id
      JOIN grades g ON u.grade_id = g.id
      JOIN organizations o ON u.organizacion_id = o.id;
    `);
    console.log('✅ Vista user_details creada correctamente.');

    // Vista 2: student_user_details
    await pool.query(`
      CREATE OR REPLACE VIEW student_user_details AS
      SELECT
        su.id,
        su.email,
        su.role,
        s.student_id,
        s.name AS student_name,
        s.rh,
        g.grade AS grade,
        o.name AS organization
      FROM student_users su
      JOIN students s ON su.student_id = s.id
      JOIN grades g ON s.grade = g.grade
      JOIN organizations o ON s.organizacion_id = o.id;
    `);
    console.log('✅ Vista student_user_details creada correctamente.');

    // Vista 3: appointments_details
    await pool.query(`
      CREATE OR REPLACE VIEW appointments_details AS
      SELECT
        a.id,
        a.topic,
        a.tutor,
        a.date,
        a.notes,
        a.status,
        s.name AS student_name,
        u.name AS tutor_name,
        o.name AS organization
      FROM appointments a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON a.user_id = u.id
      JOIN organizations o ON a.organizacion_id = o.id;
    `);
    console.log('✅ Vista appointments_details creada correctamente.');

    // Vista 4: reservation_details
    await pool.query(`
      CREATE OR REPLACE VIEW reservation_details AS
      SELECT
        r.id,
        u.name AS user_name, -- Cambiado de r.name a u.name
        g.grade AS grade,
        p.place,
        r.start,
        r.finish,
        o.name AS organization
      FROM reservations r
      JOIN users u ON r.user_id = u.id -- Añadida la unión con la tabla users
      JOIN grades g ON r.grade_id = g.id
      JOIN places p ON r.place_id = p.id
      JOIN organizations o ON r.organizacion_id = o.id;
    `);
    console.log('✅ Vista reservation_details creada correctamente.');

    // Vista 5: report_place_details
    await pool.query(`
      CREATE OR REPLACE VIEW report_place_details AS
      SELECT
        rp.id,
        rp.name,
        g.grade AS grade,
        p.place,
        rp.start,
        rp.finish,
        o.name AS organization
      FROM report_place rp
      JOIN grades g ON rp.grade_id = g.id
      JOIN places p ON rp.place_id = p.id
      JOIN organizations o ON rp.organizacion_id = o.id;
    `);
    console.log('✅ Vista report_place_details creada correctamente.');

    // Vista 6: social_work_details
    await pool.query(`
      CREATE OR REPLACE VIEW social_work_details AS
      SELECT
        sw.id,
        sw.name,
        sw.description,
        sw.hours,
        sw.date,
        o.name AS organization
      FROM social_work sw
      JOIN organizations o ON sw.organizacion_id = o.id;
    `);
    console.log('✅ Vista social_work_details creada correctamente.');

    // Vista 7: user_devices_details
    await pool.query(`
      CREATE OR REPLACE VIEW user_devices_details AS
      SELECT
        ud.id,
        u.name AS user_name,
        ud.email,
        ud.player_id,
        ud.device_type,
        ud.last_active
      FROM user_devices ud
      JOIN users u ON ud.email = u.email;
    `);
    console.log('✅ Vista user_devices_details creada correctamente.');

    // Vista 8: organization_status_details
    await pool.query(`
      CREATE OR REPLACE VIEW organization_status_details AS
      SELECT
        o.id,
        o.name,
        o.contact,
        s.status AS status,
        o.created_at,
        o.expires_at
      FROM organizations o
      JOIN status s ON o.status_id = s.id;
    `);
    console.log('✅ Vista organization_status_details creada correctamente.');

    console.log('✅ Todas las vistas han sido creadas correctamente.');
  } catch (error) {
    console.error('❌ Error al crear las vistas:', error);
  } finally {
  }
};

createViews();