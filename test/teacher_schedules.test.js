import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from 'file:///C:/Users/jhoan/Documents/heroku-vide/config/db.js';
import jwt from 'jsonwebtoken';

describe('Teacher Schedules Routes', () => {
  let sandbox;
  let mockClient;
  let token;
  const testUser = { userId: 1, orgId: 'org_cwn_test' };

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mockClient = {
      query: sandbox.stub(),
      release: sandbox.stub(),
    };
    sandbox.stub(pool, 'connect').resolves(mockClient);
    mockClient.query.withArgs("SELECT set_config('app.current_org_id', $1, false)", [testUser.orgId]).resolves();
    token = jwt.sign(testUser, SECRET_KEY, { expiresIn: '1h' });
    sandbox.stub(pool, 'query').resolves({}); // Default for direct pool.query calls
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('GET /teacher-schedules/create-schedule', () => {
    const scheduleData = {
      Hora: '08:00 - 09:00',
      LunesHora: 'Matemáticas',
      MartesHora: 'Física',
      MiercolesHora: 'Química',
      JuevesHora: 'Biología',
      ViernesHora: 'Literatura',
      nombre: 'ProfesorA',
    };

    it('should create a teacher schedule successfully', async () => {
      mockClient.query.resolves({});

      const res = await request(app)
        .get('/teacher-schedules/create-schedule')
        .query(scheduleData);

      expect(res.statusCode).to.equal(200);
      expect(res.text).to.equal('Horario registrado');
      expect(mockClient.query.calledOnceWith(
        sinon.match(/INSERT INTO ProfesorA/),
        [
          scheduleData.Hora,
          scheduleData.LunesHora,
          scheduleData.MartesHora,
          scheduleData.MiercolesHora,
          scheduleData.JuevesHora,
          scheduleData.ViernesHora,
        ]
      )).to.be.true;
    });

    it('should return 400 if required data is missing', async () => {
      const { Hora, ...dataWithout } = scheduleData;
      const res = await request(app)
        .get('/teacher-schedules/create-schedule')
        .query(dataWithout);

      expect(res.statusCode).to.equal(400);
      expect(res.text).to.equal('Todos los parámetros son requeridos.');
    });

    it('should return 500 if database insert fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .get('/teacher-schedules/create-schedule')
        .query(scheduleData);

      expect(res.statusCode).to.equal(500);
      expect(res.text).to.include('Error al registrar el horario');
    });
  });

  describe('GET /teacher-schedules/create-teacher-table', () => {
    it('should create a teacher table successfully', async () => {
      mockClient.query.resolves({});

      const res = await request(app).get('/teacher-schedules/create-teacher-table?profe=NewTeacher');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('La tabla se creó correctamente.');
      expect(mockClient.query.calledOnceWith(
        sinon.match(/CREATE TABLE NewTeacher/)
      )).to.be.true;
    });

    it('should return 400 if profe is missing', async () => {
      const res = await request(app).get('/teacher-schedules/create-teacher-table');

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.equal(0);
      expect(res.body.message).to.equal("El parámetro 'profe' es requerido.");
    });

    it('should return 500 if database operation fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app).get('/teacher-schedules/create-teacher-table?profe=ErrorTeacher');

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.include('Error al crear la tabla');
    });
  });

  describe('POST /teacher-schedules/delete-all-schedules', () => {
    it('should delete all teacher schedules successfully', async () => {
      mockClient.query.withArgs(sinon.match(/SELECT table_name/)).resolves({ rows: [{ table_name: 'table1' }, { table_name: 'table2' }] });
      mockClient.query.withArgs(sinon.match(/DROP TABLE IF EXISTS/)).resolves({});

      const res = await request(app).post('/teacher-schedules/delete-all-schedules');

      expect(res.statusCode).to.equal(200);
      expect(res.text).to.equal('Todas las tablas han sido eliminadas exitosamente.');
      expect(mockClient.query.calledWith(sinon.match(/DROP TABLE IF EXISTS table1/))).to.be.true;
      expect(mockClient.query.calledWith(sinon.match(/DROP TABLE IF EXISTS table2/))).to.be.true;
    });

    it('should return 500 if database operation fails', async () => {
      mockClient.query.withArgs(sinon.match(/SELECT table_name/)).throws(new Error('DB Error'));

      const res = await request(app).post('/teacher-schedules/delete-all-schedules');

      expect(res.statusCode).to.equal(500);
      expect(res.text).to.include('Error al eliminar las tablas');
    });
  });

  describe('POST /teacher-schedules/delete-schedule/:name', () => {
    it('should delete a specific teacher schedule successfully', async () => {
      pool.query.resolves({});

      const res = await request(app).post('/teacher-schedules/delete-schedule/OldTeacherSchedule');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Tabla \'OldTeacherSchedule\' eliminada exitosamente');
      expect(pool.query.calledOnceWith(
        sinon.match(/DROP TABLE IF EXISTS horarios_profes\."OldTeacherSchedule"/)
      )).to.be.true;
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app).post('/teacher-schedules/delete-schedule/');

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Nombre de tabla inválido');
    });

    it('should return 500 if database operation fails', async () => {
      pool.query.throws(new Error('DB Error'));

      const res = await request(app).post('/teacher-schedules/delete-schedule/ErrorSchedule');

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /teacher-schedules/get-account-schedule-record', () => {
    const scheduleName = 'TeacherA';
    const mockSchedule = [{ table_name: scheduleName }];

    it('should return account schedule record successfully', async () => {
      mockClient.query.resolves({ rows: mockSchedule });

      const res = await request(app).get(`/teacher-schedules/get-account-schedule-record?name=${scheduleName}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockSchedule);
      expect(mockClient.query.calledOnceWith(
        sinon.match(/SELECT table_name FROM information_schema.tables WHERE table_schema = 'horarios_profes' AND table_name = \$1/),
        [scheduleName.toLowerCase()]
      )).to.be.true;
    });

    it('should return 404 if no tables match the name', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app).get(`/teacher-schedules/get-account-schedule-record?name=NonExistent`);

      expect(res.statusCode).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No hay tablas que coincidan con el nombre proporcionado');
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app).get(`/teacher-schedules/get-account-schedule-record`);

      expect(res.statusCode).to.equal(400);
      expect(res.text).to.include("El parámetro 'name' es requerido.");
    });

    it('should return 500 if database query fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app).get(`/teacher-schedules/get-account-schedule-record?name=${scheduleName}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /teacher-schedules/get-schedule-record', () => {
    const mockSchedules = [{ table_name: 'TeacherA' }, { table_name: 'TeacherB' }];

    it('should return all teacher schedule records successfully', async () => {
      mockClient.query.resolves({ rows: mockSchedules });

      const res = await request(app).get('/teacher-schedules/get-schedule-record');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockSchedules);
      expect(mockClient.query.calledOnceWith(
        sinon.match(/SELECT table_name FROM information_schema.tables WHERE table_schema = 'horarios_profes'/)
      )).to.be.true;
    });

    it('should return no reservations message if no schedules found', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app).get('/teacher-schedules/get-schedule-record');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No se encontraron reservations para el ID proporcionado');
    });

    it('should return 500 if database query fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app).get('/teacher-schedules/get-schedule-record');

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /teacher-schedules/view-schedule', () => {
    const scheduleName = 'TeacherA';
    const mockScheduleData = [
      { horas: '08:00 - 09:00', Lunes: 'Clase 1' },
      { horas: '09:00 - 10:00', Lunes: 'Clase 2' },
    ];

    it('should return schedule data successfully', async () => {
      mockClient.query.resolves({ rows: mockScheduleData });

      const res = await request(app).get(`/teacher-schedules/view-schedule?name=${scheduleName}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockScheduleData);
      expect(mockClient.query.calledOnceWith(
        sinon.match(/SELECT \* FROM horarios_profes\."TeacherA"/)
      )).to.be.true;
    });

    it('should return no_hay_registros if no data found', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app).get(`/teacher-schedules/view-schedule?name=EmptyTeacher`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.data).to.equal('No_hay_registros');
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app).get(`/teacher-schedules/view-schedule`);

      expect(res.statusCode).to.equal(400);
      expect(res.text).to.include("El parámetro 'name' es requerido.");
    });

    it('should return 500 if database query fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app).get(`/teacher-schedules/view-schedule?name=${scheduleName}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.data).to.equal('No_hay_registros');
    });
  });

  describe('GET /teacher-schedules/check-existence', () => {
    const profeName = 'TeacherC';
    const mockResult = [{ table_name: profeName }];

    it('should return existence status successfully', async () => {
      mockClient.query.resolves({ rows: mockResult });

      const res = await request(app).get(`/teacher-schedules/check-existence?profe=${profeName}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockResult);
      expect(mockClient.query.calledOnceWith(
        sinon.match(/SELECT table_name FROM information_schema.tables WHERE table_schema = 'horarios_profes' AND table_name = \$1/),
        [profeName]
      )).to.be.true;
    });

    it('should return no reservations message if not found', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app).get(`/teacher-schedules/check-existence?profe=NonExistent`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No se encontraron reservations para el ID proporcionado');
    });

    it('should return 400 if profe is missing', async () => {
      const res = await request(app).get(`/teacher-schedules/check-existence`);

      expect(res.statusCode).to.equal(400);
      expect(res.text).to.include("El parámetro 'name' es requerido.");
    });

    it('should return 500 if database query fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app).get(`/teacher-schedules/check-existence?profe=${profeName}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });
});