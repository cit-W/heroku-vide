import pool from './db.js';

const setupDatabase = async () => {
  try {
    console.log('🔄 Verificando y creando tablas necesarias...');

    await pool.query(`
      DROP TABLE IF EXISTS events CASCADE;
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
      DROP TABLE IF EXISTS organizations CASCADE;
      DROP TABLE IF EXISTS status CASCADE;
      DROP TABLE IF EXISTS monthly_topics CASCADE;
      DROP TABLE IF EXISTS ai_memory CASCADE;

    `);

    await pool.query(`
      CREATE SCHEMA IF NOT EXISTS "public";
    `);

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
      CREATE SEQUENCE IF NOT EXISTS studentuser_id_seq;
      CREATE SEQUENCE IF NOT EXISTS events_id_seq;
      CREATE SEQUENCE IF NOT EXISTS ai_memory_id_seq;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "public"."status" (
        "id" INTEGER PRIMARY KEY,
        "status" CHAR(15) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "public"."organizations" (
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "public"."departments" (
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

    

    

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "public"."roles" (
        "id" INTEGER NOT NULL DEFAULT nextval('roles_id_seq'::regclass),
        "role_code" INTEGER NOT NULL,
        "role_name" TEXT NOT NULL,
        "organizacion_id" VARCHAR(16) NOT NULL,
        PRIMARY KEY ("id"),
        UNIQUE ("role_code", "organizacion_id")
      );
      ALTER TABLE "public"."roles" ADD CONSTRAINT "fk_roles_organizacion_id_organizations_id" FOREIGN KEY("organizacion_id") REFERENCES "public"."organizations"("id");
      ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY org_isolation_policy ON "public"."roles" FOR ALL USING (organizacion_id = current_setting('app.current_org_id', true));
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "public"."places" (
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "public"."users" (
        "id" INTEGER NOT NULL DEFAULT nextval('users_id_seq'::regclass),
        "personal_id" VARCHAR(20) NOT NULL UNIQUE,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "organizacion_id" VARCHAR(16) NOT NULL,
        "role_id" INTEGER NOT NULL,
        "department_id" INTEGER NOT NULL,
        "personal_permissions" BOOLEAN NOT NULL DEFAULT FALSE,
        "email_verified" BOOLEAN DEFAULT FALSE,
        "email_verification_token" VARCHAR(255),
        "email_verification_token_expires_at" TIMESTAMP,
        "refresh_token" VARCHAR(255),
        PRIMARY KEY ("id")
      );
      ALTER TABLE "public"."users" ADD CONSTRAINT "fk_users_organizacion_id_organizations_id" FOREIGN KEY("organizacion_id") REFERENCES "public"."organizations"("id");
      ALTER TABLE "public"."users" ADD CONSTRAINT "fk_users_role_id_roles_id" FOREIGN KEY("role_id") REFERENCES "public"."roles"("id");
      ALTER TABLE "public"."users" ADD CONSTRAINT "fk_users_department_id_departments_id" FOREIGN KEY("department_id") REFERENCES "public"."departments"("id");
      ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY org_isolation_policy ON "public"."users" FOR ALL USING (organizacion_id = current_setting('app.current_org_id', true));
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "public"."students" (
        "id" INTEGER NOT NULL DEFAULT nextval('students_id_seq'::regclass),
        "student_id" INTEGER NOT NULL UNIQUE,
        "name" TEXT NOT NULL,
        "rh" CHAR(4),
        "organizacion_id" VARCHAR(16) NOT NULL,
        "department_id" INTEGER NOT NULL,
        PRIMARY KEY ("id")
      );
  ALTER TABLE "public"."students" ADD CONSTRAINT "fk_students_department_id_departments_id" FOREIGN KEY("department_id") REFERENCES "public"."departments"("id");
  ALTER TABLE "public"."students" ADD CONSTRAINT "fk_students_organizacion_id_organizations_id" FOREIGN KEY("organizacion_id") REFERENCES "public"."organizations"("id");

  DROP POLICY IF EXISTS org_isolation_policy ON "public"."students";

  ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;
  CREATE POLICY org_isolation_policy ON "public"."students" FOR ALL USING (organizacion_id = current_setting('app.current_org_id', true));
`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "public"."reservations" (
        "id" INTEGER NOT NULL DEFAULT nextval('reserva_id_seq'::regclass),
        "user_id" INTEGER NOT NULL,
        "department_id" INTEGER NOT NULL,
        "place_id" INTEGER NOT NULL,
        "start" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "finish" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        "organizacion_id" VARCHAR(16) NOT NULL,
        "status" VARCHAR(50) NOT NULL DEFAULT 'upcoming',
        PRIMARY KEY ("id")
      );
      ALTER TABLE "public"."reservations" ADD CONSTRAINT "fk_reservations_user_id_users_id" FOREIGN KEY("user_id") REFERENCES "public"."users"("id");
      ALTER TABLE "public"."reservations" ADD CONSTRAINT "fk_reservations_department_id_departments_id" FOREIGN KEY("department_id") REFERENCES "public"."departments"("id");
      ALTER TABLE "public"."reservations" ADD CONSTRAINT "fk_reservations_place_id_places_id" FOREIGN KEY("place_id") REFERENCES "public"."places"("id");
      ALTER TABLE "public"."reservations" ADD CONSTRAINT "fk_reservations_organizacion_id_organizations_id" FOREIGN KEY("organizacion_id") REFERENCES "public"."organizations"("id");
      ALTER TABLE "public"."reservations" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY org_isolation_policy ON "public"."reservations" FOR ALL USING (organizacion_id = current_setting('app.current_org_id', true));
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "public"."social_work" (
        "id" INTEGER NOT NULL DEFAULT nextval('trabajo_social_id_seq'::regclass),
        "user_id" INTEGER NOT NULL,
        "description" TEXT NOT NULL,
        "hours" TEXT NOT NULL,
        "date" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        "organizacion_id" VARCHAR(16) NOT NULL,
        "status" VARCHAR(50) NOT NULL DEFAULT 'upcoming',
        PRIMARY KEY ("id")
      );
      ALTER TABLE "public"."social_work" ADD CONSTRAINT "fk_social_work_user_id_users_id" FOREIGN KEY("user_id") REFERENCES "public"."users"("id");
      ALTER TABLE "public"."social_work" ADD CONSTRAINT "fk_social_work_organizacion_id_organizations_id" FOREIGN KEY("organizacion_id") REFERENCES "public"."organizations"("id");
      ALTER TABLE "public"."social_work" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY org_isolation_policy ON "public"."social_work" FOR ALL USING (organizacion_id = current_setting('app.current_org_id', true));

      
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "public"."appointments" (
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "public"."report_place" (
        "id" INTEGER NOT NULL DEFAULT nextval('reporte_lugar_id_seq'::regclass),
        "name" TEXT NOT NULL,
        "department_id" INTEGER NOT NULL,
        "place_id" INTEGER NOT NULL,
        "start" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "finish" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        "organizacion_id" VARCHAR(16) NOT NULL,
        PRIMARY KEY ("id")
      );
      ALTER TABLE "public"."report_place" ADD CONSTRAINT "fk_report_place_department_id_departments_id" FOREIGN KEY("department_id") REFERENCES "public"."departments"("id");
      ALTER TABLE "public"."report_place" ADD CONSTRAINT "fk_report_place_place_id_places_id" FOREIGN KEY("place_id") REFERENCES "public"."places"("id");
      ALTER TABLE "public"."report_place" ADD CONSTRAINT "fk_report_place_organizacion_id_organizations_id" FOREIGN KEY("organizacion_id") REFERENCES "public"."organizations"("id");
      ALTER TABLE "public"."report_place" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY org_isolation_policy ON "public"."report_place" FOR ALL USING (organizacion_id = current_setting('app.current_org_id', true));
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "public"."student_users" (
        "id" INTEGER NOT NULL DEFAULT nextval('studentuser_id_seq'::regclass),
        "student_id" INTEGER NOT NULL UNIQUE,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "role_id" INTEGER NOT NULL,
        "email_verified" BOOLEAN DEFAULT FALSE,
        "email_verification_token" VARCHAR(255),
        "email_verification_token_expires_at" TIMESTAMP,
        "refresh_token" VARCHAR(255),
        PRIMARY KEY ("id")
      );
      ALTER TABLE "public"."student_users" ADD CONSTRAINT "fk_student_users_student_id_students_id" FOREIGN KEY("student_id") REFERENCES "public"."students"("id");
      ALTER TABLE "public"."student_users" ADD CONSTRAINT "fk_student_users_role_id_roles_id" FOREIGN KEY("role_id") REFERENCES "public"."roles"("id");
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "public"."user_devices" (
        "id" INTEGER NOT NULL DEFAULT nextval('user_devices_id_seq'::regclass),
        "user_id" INTEGER NOT NULL,
        "player_id" TEXT NOT NULL UNIQUE,
        "organizacion_id" VARCHAR(16) NOT NULL,
        "device_type" TEXT,
        "app_version" VARCHAR(20),
        "is_active" BOOLEAN DEFAULT true,
        "last_seen_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "device_model" TEXT,
        "os_version" VARCHAR(20),
        "ip_address" VARCHAR(45),
        PRIMARY KEY ("id")
      );
      ALTER TABLE "public"."user_devices" ADD CONSTRAINT "fk_user_devices_user_id_users_id" FOREIGN KEY("user_id") REFERENCES "public"."users"("id");
      ALTER TABLE "public"."user_devices" ADD CONSTRAINT "fk_user_devices_organizacion_id_organizations_id" FOREIGN KEY("organizacion_id") REFERENCES "public"."organizations"("id");
      ALTER TABLE "public"."user_devices" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY org_isolation_policy ON "public"."user_devices" FOR ALL USING (organizacion_id = current_setting('app.current_org_id', true));
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "public"."events" (
          "id" SERIAL PRIMARY KEY,
          "organization_id" VARCHAR(16) NOT NULL,
          "tema" VARCHAR(50) NOT NULL,
          "acargo" VARCHAR(40),
          "mediagroup_video" VARCHAR(20),
          "mediagroup_sonido" VARCHAR(20),
          "fecha" TIMESTAMPTZ NOT NULL,
          "descripcion" VARCHAR(200),
          "place_id" INTEGER,
          "n_semana" INT NOT NULL
      );
      ALTER TABLE "public"."events" ADD CONSTRAINT "fk_events_organizacion_id_organizations_id" FOREIGN KEY("organization_id") REFERENCES "public"."organizations"("id");
      ALTER TABLE "public"."events" ADD CONSTRAINT "fk_events_place_id_places_id" FOREIGN KEY("place_id") REFERENCES "public"."places"("id");
      ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY org_isolation_policy ON "public"."events" FOR ALL USING (organization_id = current_setting('app.current_org_id', true));

      CREATE INDEX IF NOT EXISTS idx_events_fecha ON "public"."events" (fecha);
      CREATE INDEX IF NOT EXISTS idx_events_organization_id ON "public"."events" (organization_id);
      CREATE INDEX IF NOT EXISTS idx_events_org_fecha ON "public"."events" (organization_id, fecha);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "public"."monthly_topics" (
        "id" SERIAL PRIMARY KEY,
        "organization_id" VARCHAR(16) NOT NULL,
        "year" INTEGER NOT NULL,
        "month" INTEGER NOT NULL,
        "topic" VARCHAR(255) NOT NULL,
        UNIQUE ("organization_id", "year", "month")
      );
      ALTER TABLE "public"."monthly_topics" ADD CONSTRAINT "fk_monthly_topics_organization_id_organizations_id" FOREIGN KEY("organization_id") REFERENCES "public"."organizations"("id");
      DROP POLICY IF EXISTS org_isolation_policy ON "public"."monthly_topics";
      ALTER TABLE "public"."monthly_topics" ENABLE ROW LEVEL SECURITY;
      CREATE POLICY org_isolation_policy ON "public"."monthly_topics" FOR ALL USING (organization_id = current_setting('app.current_org_id', true));
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "public"."ai_memory" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER,
        "organization_id" VARCHAR(16),
        "role" TEXT,
        "key" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("user_id", "organization_id", "role", "key")
      );
      ALTER TABLE "public"."ai_memory" ADD CONSTRAINT "fk_ai_memory_user_id_users_id" FOREIGN KEY("user_id") REFERENCES "public"."users"("id");
      ALTER TABLE "public"."ai_memory" ADD CONSTRAINT "fk_ai_memory_organization_id_organizations_id" FOREIGN KEY("organization_id") REFERENCES "public"."organizations"("id");
    `);

    await pool.query(`
      
    `);

    console.log('✅ Todas las tablas han sido verificadas o creadas correctamente.');
    console.log('🔐 Row-Level Security ha sido habilitado en las tablas pertinentes.');

    const indexQueries = `
      -- Índices para Claves Foráneas (FKs) y columnas usadas en JOINs
      CREATE INDEX IF NOT EXISTS idx_users_organizacion_id ON users(organizacion_id);
      CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
      CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
      CREATE INDEX IF NOT EXISTS idx_students_organizacion_id ON students(organizacion_id);
      CREATE INDEX IF NOT EXISTS idx_students_department_id ON students(department_id);
      CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
      CREATE INDEX IF NOT EXISTS idx_reservations_place_id ON reservations(place_id);
      CREATE INDEX IF NOT EXISTS idx_reservations_department_id ON reservations(department_id);
      CREATE INDEX IF NOT EXISTS idx_reservations_organizacion_id ON reservations(organizacion_id);
      CREATE INDEX IF NOT EXISTS idx_events_place_id ON events(place_id);
      CREATE INDEX IF NOT EXISTS idx_events_organization_id ON events(organization_id);
      CREATE INDEX IF NOT EXISTS idx_social_work_user_id ON social_work(user_id);
      CREATE INDEX IF NOT EXISTS idx_social_work_organizacion_id ON social_work(organizacion_id);
      CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_devices_organizacion_id ON user_devices(organizacion_id);
      CREATE INDEX IF NOT EXISTS idx_roles_organizacion_id ON roles(organizacion_id);
      CREATE INDEX IF NOT EXISTS idx_places_organizacion_id ON places(organizacion_id);

      -- Índices para búsquedas comunes (WHERE)
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_reservations_start_finish ON reservations(start, finish);
      CREATE INDEX IF NOT EXISTS idx_events_fecha ON events(fecha);
    `;

    console.log('Creando índices...');
    await pool.query(indexQueries);
    console.log('Índices creados con éxito.');
  } catch (error) {
    console.error('❌ Error al configurar la base de datos:', error);
  } finally {
    await pool.end();
  }
};

setupDatabase();
