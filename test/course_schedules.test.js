import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from 'file:///C:/Users/jhoan/Documents/heroku-vide/config/db.js';

describe('Course Schedules Routes', () => {
  let sandbox;
  let mockClient;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mockClient = {
      query: sandbox.stub(),
      release: sandbox.stub(),
    };
    sandbox.stub(pool, 'connect').resolves(mockClient);
    sandbox.stub(pool, 'query').resolves({}); // Default for direct pool.query calls
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('POST /course-schedules/create-schedule', () => {
    const scheduleData = {
      Hora: '08:00 - 09:00',
      LunesHora: 'Matemáticas',
      MartesHora: 'Física',
      MiercolesHora: 'Química',
      JuevesHora: 'Biología',
      ViernesHora: 'Literatura',
      nombre: '10A',
    };

    it('should create a schedule successfully', async () => {
      const res = await request(app)
        .post('/course-schedules/create-schedule')
        .send(scheduleData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Horario social registrado con éxito');
      expect(pool.query.calledOnceWith(
        sinon.match(/INSERT INTO horarios_cursos\."10A"/),
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
        .post('/course-schedules/create-schedule')
        .send(dataWithout);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Faltan datos para completar el registro');
    });

    it('should return 500 if database insert fails', async () => {
      pool.query.throws(new Error('DB Error'));

      const res = await request(app)
        .post('/course-schedules/create-schedule')
        .send(scheduleData);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Error al registrar el trabajo social');
    });
  });

  describe('GET /course-schedules/create-course-table', () => {
    it('should create a course table successfully', async () => {
      const res = await request(app).get('/course-schedules/create-course-table?curso=NewCourse');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.equal(1);
      expect(res.body.message).to.equal('La tabla \'NewCourse\' se creó correctamente.');
      expect(pool.query.calledOnceWith(
        sinon.match(/CREATE TABLE IF NOT EXISTS horarios_cursos\."NewCourse"/)
      )).to.be.true;
    });

    it('should return 400 if curso is missing', async () => {
      const res = await request(app).get('/course-schedules/create-course-table');

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.equal(0);
      expect(res.body.error).to.equal('No se proporcionó un curso válido');
    });

    it('should return 500 if database operation fails', async () => {
      pool.query.throws(new Error('DB Error'));

      const res = await request(app).get('/course-schedules/create-course-table?curso=ErrorCourse');

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.equal(0);
      expect(res.body.error).to.include('Error al crear la tabla');
    });
  });

  describe('POST /course-schedules/delete-schedule/:name', () => {
    it('should delete a schedule table successfully', async () => {
      const res = await request(app).post('/course-schedules/delete-schedule/OldCourse');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Tabla \'OldCourse\' eliminada exitosamente');
      expect(pool.query.calledOnceWith(
        sinon.match(/DROP TABLE IF EXISTS horarios_cursos\."OldCourse"/)
      )).to.be.true;
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app).post('/course-schedules/delete-schedule/');

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('No se proporcionó un cedula válido');
    });

    it('should return 500 if database operation fails', async () => {
      pool.query.throws(new Error('DB Error'));

      const res = await request(app).post('/course-schedules/delete-schedule/ErrorCourse');

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /course-schedules/delete-all-schedules', () => {
    it('should delete all schedules successfully', async () => {
      mockClient.query.withArgs(sinon.match(/SELECT tablename/)).resolves({ rows: [{ tablename: 'table1' }, { tablename: 'table2' }] });
      mockClient.query.withArgs(sinon.match(/DROP TABLE IF EXISTS/)).resolves({});

      const res = await request(app).get('/course-schedules/delete-all-schedules');

      expect(res.statusCode).to.equal(200);
      expect(res.text).to.equal('Tablas eliminadas exitosamente.');
      expect(mockClient.query.calledWith(sinon.match(/DROP TABLE IF EXISTS horarios_cursos\."table1" CASCADE/))).to.be.true;
      expect(mockClient.query.calledWith(sinon.match(/DROP TABLE IF EXISTS horarios_cursos\."table2" CASCADE/))).to.be.true;
    });

    it('should return message if no tables found', async () => {
      mockClient.query.withArgs(sinon.match(/SELECT tablename/)).resolves({ rows: [] });

      const res = await request(app).get('/course-schedules/delete-all-schedules');

      expect(res.statusCode).to.equal(200);
      expect(res.text).to.equal('No se encontraron tablas en la base de datos.');
    });

    it('should return 500 if database operation fails', async () => {
      mockClient.query.withArgs(sinon.match(/SELECT tablename/)).throws(new Error('DB Error'));

      const res = await request(app).get('/course-schedules/delete-all-schedules');

      expect(res.statusCode).to.equal(500);
      expect(res.text).to.include('Error');
    });
  });

  describe('GET /course-schedules/get-account-schedule-record', () => {
    const scheduleName = '10A';
    const mockSchedule = [{ table_name: scheduleName }];

    it('should return account schedule record successfully', async () => {
      pool.query.resolves({ rows: mockSchedule });

      const res = await request(app).get(`/course-schedules/get-account-schedule-record?name=${scheduleName}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockSchedule);
      expect(pool.query.calledOnceWith(
        sinon.match(/SELECT table_name FROM information_schema.tables WHERE table_schema = 'horarios_cursos' AND table_name = \$1/),
        [scheduleName.toLowerCase()]
      )).to.be.true;
    });

    it('should return 404 if no tables match the name', async () => {
      pool.query.resolves({ rows: [] });

      const res = await request(app).get(`/course-schedules/get-account-schedule-record?name=NonExistent`);

      expect(res.statusCode).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No hay tablas que coincidan con el nombre proporcionado');
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app).get(`/course-schedules/get-account-schedule-record`);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('No se proporcionó un nombre válido');
    });

    it('should return 500 if database query fails', async () => {
      pool.query.throws(new Error('DB Error'));

      const res = await request(app).get(`/course-schedules/get-account-schedule-record?name=${scheduleName}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /course-schedules/get-schedule-record', () => {
    const mockSchedules = [{ table_name: '10A' }, { table_name: '11B' }];

    it('should return all schedule records successfully', async () => {
      mockClient.query.resolves({ rows: mockSchedules });

      const res = await request(app).get('/course-schedules/get-schedule-record');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockSchedules);
      expect(mockClient.query.calledOnceWith(
        sinon.match(/SELECT table_name FROM information_schema.tables WHERE table_schema = 'horarios_cursos'/)
      )).to.be.true;
    });

    it('should return no reservations message if no schedules found', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app).get('/course-schedules/get-schedule-record');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No se encontraron reservations para el ID proporcionado');
    });

    it('should return 500 if database query fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app).get('/course-schedules/get-schedule-record');

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /course-schedules/view-schedule', () => {
    const scheduleName = '10A';
    const mockScheduleData = [
      { horas: '08:00 - 09:00', Lunes: 'Matemáticas' },
      { horas: '09:00 - 10:00', Lunes: 'Física' },
    ];

    it('should return schedule data successfully', async () => {
      mockClient.query.resolves({ rows: mockScheduleData });

      const res = await request(app).get(`/course-schedules/view-schedule?name=${scheduleName}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockScheduleData);
      expect(mockClient.query.calledOnceWith(
        sinon.match(/SELECT \* FROM horarios_cursos\."10A"/)
      )).to.be.true;
    });

    it('should return no_hay_registros if no data found', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app).get(`/course-schedules/view-schedule?name=EmptySchedule`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.equal('No_hay_registros');
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app).get(`/course-schedules/view-schedule`);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('No se proporcionó un nombre válido');
    });

    it('should return no_hay_registros on database error', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app).get(`/course-schedules/view-schedule?name=${scheduleName}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.equal('No_hay_registros');
    });
  });

  describe('GET /course-schedules/personal-schedule', () => {
    const scheduleName = 'PersonalSchedule';
    const mockScheduleData = [
      { horas: '10:00 - 11:00', Lunes: 'Reunión' },
    ];

    it('should return personal schedule data successfully', async () => {
      mockClient.query.resolves({ rows: mockScheduleData });

      const res = await request(app).get(`/course-schedules/personal-schedule?name=${scheduleName}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockScheduleData);
      expect(mockClient.query.calledOnceWith(
        sinon.match(/SELECT \* FROM horarios_cursos\."PersonalSchedule"/)
      )).to.be.true;
    });

    it('should return no_hay_registros if no data found', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app).get(`/course-schedules/personal-schedule?name=EmptyPersonal`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.equal('No_hay_registros');
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app).get(`/course-schedules/personal-schedule`);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('No se proporcionó un nombre válido');
    });

    it('should return no_hay_registros on database error', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app).get(`/course-schedules/personal-schedule?name=${scheduleName}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.equal('No_hay_registros');
    });
  });
});