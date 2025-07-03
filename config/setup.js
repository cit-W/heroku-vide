import pool from './db.js';

const setupDatabase = async () => {
  try {
    console.log('🔄 Verificando y creando tablas necesarias...');

    // Crear schema
    await pool.query(`
      CREATE SCHEMA IF NOT EXISTS "public";
    `);

    // Crear secuencias
    await pool.query(`
      CREATE SEQUENCE IF NOT EXISTS roles_id_seq;
      CREATE SEQUENCE IF NOT EXISTS user_devices_id_seq;
      CREATE SEQUENCE IF NOT EXISTS reporte_lugar_id_seq;
      CREATE SEQUENCE IF NOT EXISTS reserva_id_seq;
      CREATE SEQUENCE IF NOT EXISTS users_id_seq;
      CREATE SEQUENCE IF NOT EXISTS departamento_id_seq;
      CREATE SEQUENCE IF NOT EXISTS students_id_seq;
      CREATE SEQUENCE IF NOT EXISTS citaciones_id_seq;
      CREATE SEQUENCE IF NOT EXISTS trabajo_social_id_seq;
      CREATE SEQUENCE IF NOT EXISTS places_id_seq;
      CREATE SEQUENCE IF NOT EXISTS escuela_id_seq;
      CREATE SEQUENCE IF NOT EXISTS studentuser_id_seq;
      CREATE SEQUENCE IF NOT EXISTS grades_id_seq;
    `);

    // Eliminar tablas existentes (en orden inverso a las dependencias)
    await pool.query(`
      DROP TABLE IF EXISTS user_devices CASCADE;
      DROP TABLE IF EXISTS appointments CASCADE;
      DROP TABLE IF EXISTS report_place CASCADE;
      DROP TABLE IF EXISTS reservations CASCADE;
      DROP TABLE IF EXISTS social_work CASCADE;
      DROP TABLE IF EXISTS student_users CASCADE;
      DROP TABLE IF EXISTS students CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS places CASCADE;
      DROP TABLE IF EXISTS roles CASCADE;
      DROP TABLE IF EXISTS departments CASCADE;
      DROP TABLE IF EXISTS education_levels CASCADE;
      DROP TABLE IF EXISTS grades CASCADE;
      DROP TABLE IF EXISTS organizations CASCADE;
      DROP TABLE IF EXISTS status CASCADE;
      
    `);

    // Crear tabla de estado
    await pool.query(`
      CREATE TABLE "public"."status" (
        "id" INTEGER PRIMARY KEY,
        "status" CHAR(15) NOT NULL
      );
    `);

    // Crear la tabla de organizaciones
    await pool.query(`
      CREATE TABLE "public"."organizations" (
        "id" VARCHAR(16) PRIMARY KEY,
        "name" TEXT NOT NULL,
        "contact" TEXT NOT NULL UNIQUE,
        "status_id" INTEGER NOT NULL,
        "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expires_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL
      );

      CREATE UNIQUE INDEX "organizations_organizaciones_contact_key"
      ON "public"."organizations" ("contact");

      ALTER TABLE "public"."organizations"
      ADD CONSTRAINT "fk_organizations_status_id_status_id" FOREIGN KEY("status_id") REFERENCES "public"."status"("id");
    `);

    // --- TABLAS CON RLS ---

    // Crear la tabla de departamentos
    await pool.query(`
      CREATE TABLE "public"."departments" (
        "id" INTEGER NOT NULL DEFAULT nextval('departamento_id_seq'::regclass),
        "department" TEXT NOT NULL,
        "organizacion_id" VARCHAR(16) NOT NULL,
        PRIMARY KEY ("id"),
        UNIQUE ("department", "organizacion_id")
      );
      ALTER TABLE "public"."departments" ADD CONSTRAINT "fk_departments_organizacion_id_organizations_id" FOREIGN KEY("organizacion_id") REFERENCES "public"."organizations"("id");
      ALTER TABLE "public"."departments" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY org_isolation_policy ON "public"."departments" FOR ALL USING (organizacion_id = current_setting('app.current_org_id', true));
    `);

    // Crear la tabla de niveles educativos
    await pool.query(`
      CREATE TABLE "public"."education_levels" (
        "id" INTEGER NOT NULL DEFAULT nextval('escuela_id_seq'::regclass),
        "level" TEXT NOT NULL,
        "organizacion_id" VARCHAR(16) NOT NULL,
        PRIMARY KEY ("id"),
        UNIQUE ("level", "organizacion_id")
      );
      ALTER TABLE "public"."education_levels" ADD CONSTRAINT "fk_education_levels_organizacion_id_organizations_id" FOREIGN KEY("organizacion_id") REFERENCES "public"."organizations"("id");
      ALTER TABLE "public"."education_levels" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY org_isolation_policy ON "public"."education_levels" FOR ALL USING (organizacion_id = current_setting('app.current_org_id', true));
    `);

    // Crear la tabla de grados
    await pool.query(`
      CREATE TABLE "public"."grades" (
        "id" INTEGER NOT NULL DEFAULT nextval('grades_id_seq'::regclass),
        "grade" TEXT NOT NULL,
        "organizacion_id" VARCHAR(16) NOT NULL,
        PRIMARY KEY ("id"),
        UNIQUE ("grade", "organizacion_id")
      );
      ALTER TABLE "public"."grades" ADD CONSTRAINT "fk_grades_organizacion_id_organizations_id" FOREIGN KEY("organizacion_id") REFERENCES "public"."organizations"("id");
      ALTER TABLE "public"."grades" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY org_isolation_policy ON "public"."grades" FOR ALL USING (organizacion_id = current_setting('app.current_org_id', true));
    `);

    // Crear la tabla de roles
    await pool.query(`
      CREATE TABLE "public"."roles" (
        "id" INTEGER NOT NULL DEFAULT nextval('roles_id_seq'::regclass),
        "role" TEXT NOT NULL,
        "organizacion_id" VARCHAR(16) NOT NULL,
        PRIMARY KEY ("id"),
        UNIQUE ("role", "organizacion_id")
      );
      ALTER TABLE "public"."roles" ADD CONSTRAINT "fk_roles_organizacion_id_organizations_id" FOREIGN KEY("organizacion_id") REFERENCES "public"."organizations"("id");
      ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY org_isolation_policy ON "public"."roles" FOR ALL USING (organizacion_id = current_setting('app.current_org_id', true));
    `);

    // Crear la tabla de lugares
    await pool.query(`
      CREATE TABLE "public"."places" (
        "id" INTEGER NOT NULL DEFAULT nextval('places_id_seq'::regclass),
        "place" TEXT NOT NULL,
        "organizacion_id" VARCHAR(16) NOT NULL,
        PRIMARY KEY ("id"),
        UNIQUE ("place", "organizacion_id")
      );
      ALTER TABLE "public"."places" ADD CONSTRAINT "fk_places_organizacion_id_organizations_id" FOREIGN KEY("organizacion_id") REFERENCES "public"."organizations"("id");
      ALTER TABLE "public"."places" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY org_isolation_policy ON "public"."places" FOR ALL USING (organizacion_id = current_setting('app.current_org_id', true));
    `);

    // Crear la tabla de usuarios
    await pool.query(`
      CREATE TABLE "public"."users" (
        "id" INTEGER NOT NULL DEFAULT nextval('users_id_seq'::regclass),
        "personal_id" VARCHAR(20) NOT NULL UNIQUE,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "organizacion_id" VARCHAR(16) NOT NULL,
        "role_id" INTEGER NOT NULL,
        "department_id" INTEGER NOT NULL,
        "education_levels_id" INTEGER NOT NULL,
        "grade_id" INTEGER NOT NULL,
        PRIMARY KEY ("id")
      );
      ALTER TABLE "public"."users" ADD CONSTRAINT "fk_users_organizacion_id_organizations_id" FOREIGN KEY("organizacion_id") REFERENCES "public"."organizations"("id");
      ALTER TABLE "public"."users" ADD CONSTRAINT "fk_users_role_id_roles_id" FOREIGN KEY("role_id") REFERENCES "public"."roles"("id");
      ALTER TABLE "public"."users" ADD CONSTRAINT "fk_users_department_id_departments_id" FOREIGN KEY("department_id") REFERENCES "public"."departments"("id");
      ALTER TABLE "public"."users" ADD CONSTRAINT "fk_users_education_levels_id_education_levels_id" FOREIGN KEY("education_levels_id") REFERENCES "public"."education_levels"("id");
      ALTER TABLE "public"."users" ADD CONSTRAINT "fk_users_grade_id_grades_id" FOREIGN KEY("grade_id") REFERENCES "public"."grades"("id");
      ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY org_isolation_policy ON "public"."users" FOR ALL USING (organizacion_id = current_setting('app.current_org_id', true));
    `);

    // Crear la tabla de estudiantes
    await pool.query(`
      CREATE TABLE "public"."students" (
        "id" INTEGER NOT NULL DEFAULT nextval('students_id_seq'::regclass),
        "student_id" INTEGER NOT NULL,
        "name" TEXT NOT NULL,
        "rh" CHAR(4),
        "grade" TEXT NOT NULL,
        "organizacion_id" VARCHAR(16) NOT NULL,
        "grade_id" INTEGER NOT NULL,
        PRIMARY KEY ("id")
      );
      ALTER TABLE "public"."students" ADD CONSTRAINT "fk_students_grade_id_grades_id" FOREIGN KEY("grade_id") REFERENCES "public"."grades"("id");
      ALTER TABLE "public"."students" ADD CONSTRAINT "fk_students_organizacion_id_organizations_id" FOREIGN KEY("organizacion_id") REFERENCES "public"."organizations"("id");
      ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY org_isolation_policy ON "public"."students" FOR ALL USING (organizacion_id = current_setting('app.current_org_id', true));
    `);

    // Crear la tabla de reservas
    await pool.query(`
      CREATE TABLE "public"."reservations" (
        "id" INTEGER NOT NULL DEFAULT nextval('reserva_id_seq'::regclass),
        "user_id" INTEGER NOT NULL, -- Cambiado de "name" a "user_id"
        "grade_id" INTEGER NOT NULL,
        "place_id" INTEGER NOT NULL,
        "start" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "finish" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        "organizacion_id" VARCHAR(16) NOT NULL,
        PRIMARY KEY ("id")
      );
      ALTER TABLE "public"."reservations" ADD CONSTRAINT "fk_reservations_user_id_users_id" FOREIGN KEY("user_id") REFERENCES "public"."users"("id"); -- Nueva FK
      ALTER TABLE "public"."reservations" ADD CONSTRAINT "fk_reservations_grade_id_grades_id" FOREIGN KEY("grade_id") REFERENCES "public"."grades"("id");
      ALTER TABLE "public"."reservations" ADD CONSTRAINT "fk_reservations_place_id_places_id" FOREIGN KEY("place_id") REFERENCES "public"."places"("id");
      ALTER TABLE "public"."reservations" ADD CONSTRAINT "fk_reservations_organizacion_id_organizations_id" FOREIGN KEY("organizacion_id") REFERENCES "public"."organizations"("id");
      ALTER TABLE "public"."reservations" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY org_isolation_policy ON "public"."reservations" FOR ALL USING (organizacion_id = current_setting('app.current_org_id', true));
    `);

    // Crear la tabla de trabajo social
    await pool.query(`
      CREATE TABLE "public"."social_work" (
        "id" INTEGER NOT NULL DEFAULT nextval('trabajo_social_id_seq'::regclass),
        "name" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "hours" TEXT NOT NULL,
        "date" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        "organizacion_id" VARCHAR(16) NOT NULL,
        PRIMARY KEY ("id")
      );
      ALTER TABLE "public"."social_work" ADD CONSTRAINT "fk_social_work_organizacion_id_organizations_id" FOREIGN KEY("organizacion_id") REFERENCES "public"."organizations"("id");
      ALTER TABLE "public"."social_work" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY org_isolation_policy ON "public"."social_work" FOR ALL USING (organizacion_id = current_setting('app.current_org_id', true));
    `);

    // Crear la tabla de citaciones
    await pool.query(`
      CREATE TABLE "public"."appointments" (
        "id" INTEGER NOT NULL DEFAULT nextval('citaciones_id_seq'::regclass),
        "topic" VARCHAR(50) NOT NULL,
        "tutor" VARCHAR(35),
        "student_id" INTEGER NOT NULL,
        "user_id" INTEGER NOT NULL,
        "date" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        "notes" TEXT,
        "status" VARCHAR(20) NOT NULL DEFAULT 'Pendiente'::character varying,
        "organizacion_id" CHAR(16) NOT NULL,
        PRIMARY KEY ("id")
      );
      ALTER TABLE "public"."appointments" ADD CONSTRAINT "fk_appointments_student_id_students_id" FOREIGN KEY("student_id") REFERENCES "public"."students"("id");
      ALTER TABLE "public"."appointments" ADD CONSTRAINT "fk_appointments_user_id_users_id" FOREIGN KEY("user_id") REFERENCES "public"."users"("id");
      ALTER TABLE "public"."appointments" ADD CONSTRAINT "fk_appointments_organizacion_id_organizations_id" FOREIGN KEY("organizacion_id") REFERENCES "public"."organizations"("id");
      ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY org_isolation_policy ON "public"."appointments" FOR ALL USING (organizacion_id = current_setting('app.current_org_id', true));
    `);

    // Crear la tabla de reporte_lugar
    await pool.query(`
      CREATE TABLE "public"."report_place" (
        "id" INTEGER NOT NULL DEFAULT nextval('reporte_lugar_id_seq'::regclass),
        "name" TEXT NOT NULL,
        "grade_id" INTEGER NOT NULL,
        "place_id" INTEGER NOT NULL,
        "start" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "finish" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        "organizacion_id" VARCHAR(16) NOT NULL,
        PRIMARY KEY ("id")
      );
      ALTER TABLE "public"."report_place" ADD CONSTRAINT "fk_report_place_grade_id_grades_id" FOREIGN KEY("grade_id") REFERENCES "public"."grades"("id");
      ALTER TABLE "public"."report_place" ADD CONSTRAINT "fk_report_place_place_id_places_id" FOREIGN KEY("place_id") REFERENCES "public"."places"("id");
      ALTER TABLE "public"."report_place" ADD CONSTRAINT "fk_report_place_organizacion_id_organizations_id" FOREIGN KEY("organizacion_id") REFERENCES "public"."organizations"("id");
      ALTER TABLE "public"."report_place" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY org_isolation_policy ON "public"."report_place" FOR ALL USING (organizacion_id = current_setting('app.current_org_id', true));
    `);

    // --- TABLAS SIN RLS (O CON LÓGICA DIFERENTE) ---

    await pool.query(`
      CREATE TABLE "public"."student_users" (
        "id" INTEGER NOT NULL DEFAULT nextval('studentuser_id_seq'::regclass),
        "student_id" INTEGER NOT NULL UNIQUE,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'student'::text,
        PRIMARY KEY ("id")
      );
      ALTER TABLE "public"."student_users" ADD CONSTRAINT "fk_student_users_student_id_students_id" FOREIGN KEY("student_id") REFERENCES "public"."students"("id");
    `);

    // Crear la tabla de dispositivos del usuario (Añadido organizacion_id y RLS)
    await pool.query(`
      CREATE TABLE "public"."user_devices" (
        "id" INTEGER NOT NULL DEFAULT nextval('user_devices_id_seq'::regclass),
        "email" VARCHAR(20) NOT NULL,
        "player_id" TEXT NOT NULL UNIQUE,
        "device_type" TEXT NOT NULL,
        "last_active" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "organizacion_id" VARCHAR(16) NOT NULL,
        PRIMARY KEY ("id")
      );
      ALTER TABLE "public"."user_devices" ADD CONSTRAINT "fk_user_devices_organizacion_id_organizations_id" FOREIGN KEY("organizacion_id") REFERENCES "public"."organizations"("id");
      ALTER TABLE "public"."user_devices" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY org_isolation_policy ON "public"."user_devices" FOR ALL USING (organizacion_id = current_setting('app.current_org_id', true));
    `);

    

    console.log('✅ Todas las tablas han sido verificadas o creadas correctamente.');
    console.log('🔐 Row-Level Security ha sido habilitado en las tablas pertinentes.');

  } catch (error) {
    console.error('❌ Error al configurar la base de datos:', error);
  } finally {
    await pool.end();
  }
};

setupDatabase();
