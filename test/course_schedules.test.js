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
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('POST /course-schedules/create-schedule', () => {
    it('should create a schedule successfully', async () => {
      mockClient.query.resolves({});

      const res = await request(app)
        .post('/course-schedules/create-schedule')
        .send({
          Hora: '8:00-9:00',
          LunesHora: 'Math',
          MartesHora: 'Science',
          MiercolesHora: 'History',
          JuevesHora: 'Art',
          ViernesHora: 'Music',
          nombre: '10thGrade',
        });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Horario social registrado con éxito');
    });

    it('should return 400 if required data is missing', async () => {
      const res = await request(app)
        .post('/course-schedules/create-schedule')
        .send({
          Hora: '8:00-9:00',
          LunesHora: 'Math',
          MartesHora: 'Science',
          MiercolesHora: 'History',
          JuevesHora: 'Art',
          ViernesHora: 'Music',
        });

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Faltan datos para completar el registro');
    });

    it('should return 500 if schedule creation fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .post('/course-schedules/create-schedule')
        .send({
          Hora: '8:00-9:00',
          LunesHora: 'Math',
          MartesHora: 'Science',
          MiercolesHora: 'History',
          JuevesHora: 'Art',
          ViernesHora: 'Music',
          nombre: '10thGrade',
        });

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /course-schedules/create-course-table', () => {
    it('should create a course table successfully', async () => {
      mockClient.query.resolves({});

      const res = await request(app)
        .get('/course-schedules/create-course-table?curso=newCourse');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.equal(1);
      expect(res.body.message).to.equal('La tabla \'newCourse\' se creó correctamente.');
    });

    it('should return 400 if course name is missing', async () => {
      const res = await request(app)
        .get('/course-schedules/create-course-table');

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.equal(0);
      expect(res.body.error).to.equal('No se proporcionó un curso válido');
    });

    it('should return 500 if table creation fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .get('/course-schedules/create-course-table?curso=newCourse');

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.equal(0);
    });
  });

  describe('POST /course-schedules/delete-schedule/:name', () => {
    it('should delete a schedule successfully', async () => {
      mockClient.query.resolves({});

      const res = await request(app)
        .post('/course-schedules/delete-schedule/oldCourse');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Tabla \'oldCourse\' eliminada exitosamente');
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app)
        .post('/course-schedules/delete-schedule/');

      expect(res.statusCode).to.equal(404); 
    });

    it('should return 500 if schedule deletion fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .post('/course-schedules/delete-schedule/oldCourse');

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /course-schedules/delete-all-schedules', () => {
    it('should delete all schedules successfully', async () => {
      mockClient.query.withArgs("SELECT tablename FROM pg_tables WHERE schemaname = 'horarios_cursos';").resolves({ rows: [{ tablename: 'table1' }, { tablename: 'table2' }] });
      mockClient.query.withArgs('DROP TABLE IF EXISTS "horarios_cursos".$1 CASCADE', ['table1']).resolves({});
      mockClient.query.withArgs('DROP TABLE IF EXISTS "horarios_cursos".$1 CASCADE', ['table2']).resolves({});

      const res = await request(app)
        .get('/course-schedules/delete-all-schedules');

      expect(res.statusCode).to.equal(200);
      expect(res.text).to.equal('Tablas eliminadas exitosamente.');
    });

    it('should return message if no tables are found', async () => {
      mockClient.query.withArgs("SELECT tablename FROM pg_tables WHERE schemaname = 'horarios_cursos';").resolves({ rows: [] });

      const res = await request(app)
        .get('/course-schedules/delete-all-schedules');

      expect(res.statusCode).to.equal(200);
      expect(res.text).to.equal('No se encontraron tablas en la base de datos.');
    });

    it('should return 500 if deleting all schedules fails', async () => {
      mockClient.query.withArgs("SELECT tablename FROM pg_tables WHERE schemaname = 'horarios_cursos';").throws(new Error('DB Error'));

      const res = await request(app)
        .get('/course-schedules/delete-all-schedules');

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('GET /course-schedules/get-account-schedule-record', () => {
    it('should return account schedule record successfully', async () => {
      mockClient.query.resolves({ rows: [{ table_name: '10thgrade' }] });

      const res = await request(app)
        .get('/course-schedules/get-account-schedule-record?name=10thGrade');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app)
        .get('/course-schedules/get-account-schedule-record');

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('No se proporcionó un nombre válido');
    });

    it('should return 404 if no tables match the name', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app)
        .get('/course-schedules/get-account-schedule-record?name=nonExistent');

      expect(res.statusCode).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No hay tablas que coincidan con el nombre proporcionado');
    });

    it('should return 500 if fetching account schedule record fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .get('/course-schedules/get-account-schedule-record?name=10thGrade');

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /course-schedules/get-schedule-record', () => {
    it('should return schedule records successfully', async () => {
      mockClient.query.resolves({ rows: [{ table_name: 'table1' }] });

      const res = await request(app)
        .get('/course-schedules/get-schedule-record');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return success false if no records are found', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app)
        .get('/course-schedules/get-schedule-record');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No se encontraron reservations para el ID proporcionado');
    });

    it('should return 500 if fetching schedule record fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .get('/course-schedules/get-schedule-record');

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /course-schedules/view-schedule', () => {
    it('should return schedule view successfully', async () => {
      mockClient.query.resolves({ rows: [{ horas: '8:00 - 9:00', Lunes: 'Math' }] });

      const res = await request(app)
        .get('/course-schedules/view-schedule?name=10thGrade');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app)
        .get('/course-schedules/view-schedule');

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('No se proporcionó un nombre válido');
    });

    it('should return No_hay_registros if no records are found', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app)
        .get('/course-schedules/view-schedule?name=nonExistent');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.equal('No_hay_registros');
    });

    it('should return 500 if viewing schedule fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .get('/course-schedules/view-schedule?name=10thGrade');

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('GET /course-schedules/personal-schedule', () => {
    it('should return personal schedule successfully', async () => {
      mockClient.query.resolves({ rows: [{ horas: '8:00 - 9:00', Lunes: 'Math' }] });

      const res = await request(app)
        .get('/course-schedules/personal-schedule?name=10thGrade');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app)
        .get('/course-schedules/personal-schedule');

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('No se proporcionó un nombre válido');
    });

    it('should return No_hay_registros if no records are found', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app)
        .get('/course-schedules/personal-schedule?name=nonExistent');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.equal('No_hay_registros');
    });

    it('should return 500 if personal schedule fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .get('/course-schedules/personal-schedule?name=10thGrade');

      expect(res.statusCode).to.equal(500);
    });
  });
});