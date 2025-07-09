import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from '../config/db.js';
import * as Citacion from 'file:///C:/Users/jhoan/Documents/heroku-vide/models/Citacion.js';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('Appointments Routes', () => {
  let sandbox;
  let mockClient;
  let token;
  const testUser = { userId: 1, orgId: 101 };

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mockClient = {
      query: sandbox.stub(),
      release: sandbox.stub(),
    };
    sandbox.stub(pool, 'connect').resolves(mockClient);
    token = jwt.sign(testUser, SECRET_KEY, { expiresIn: '1h' });
    mockClient.query.withArgs('SET app.current_org_id = $1', [testUser.orgId]).resolves();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('POST /reservations/create_citation', () => {
    it('should create a citation successfully', async () => {
      sandbox.stub(Citacion, 'createAppointment').resolves({});

      const res = await request(app)
        .post('/reservations/create_citation')
        .set('Authorization', `Bearer ${token}`)
        .query({ topic: 'Meeting', tutor: 'John Doe', student_id: 1, name: 'Student A', date: '01-01-2025 10:00' });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Citación creada con éxito');
    });

    it('should return 500 if citation creation fails', async () => {
      sandbox.stub(Citacion, 'createAppointment').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/reservations/create_citation')
        .set('Authorization', `Bearer ${token}`)
        .query({ topic: 'Meeting', tutor: 'John Doe', student_id: 1, name: 'Student A', date: '01-01-2025 10:00' });

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /reservations/get_citations', () => {
    it('should return a list of citations', async () => {
      sandbox.stub(Citacion, 'getAppointments').resolves([{ id: 1, topic: 'Meeting' }]);

      const res = await request(app)
        .get('/reservations/get_citations?person=Student A&status=Pendiente')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 400 if parameters are missing', async () => {
      const res = await request(app)
        .get('/reservations/get_citations?person=Student A')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('Faltan parámetros');
    });

    it('should return success false if no citations are found', async () => {
      sandbox.stub(Citacion, 'getAppointments').resolves([]);

      const res = await request(app)
        .get('/reservations/get_citations?person=NonExistent&status=Pendiente')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No hay citas');
    });

    it('should return 500 if fetching citations fails', async () => {
      sandbox.stub(Citacion, 'getAppointments').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/reservations/get_citations?person=Student A&status=Pendiente')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('PUT /reservations/update_citation', () => {
    it('should update a citation successfully', async () => {
      sandbox.stub(Citacion, 'updateAppointment').resolves({});

      const res = await request(app)
        .put('/reservations/update_citation')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 1, status: 'Completado' });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Citación actualizada');
    });

    it('should return 500 if citation update fails', async () => {
      sandbox.stub(Citacion, 'updateAppointment').throws(new Error('DB Error'));

      const res = await request(app)
        .put('/reservations/update_citation')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 1, status: 'Completado' });

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('GET /reservations/ids_appointments', () => {
    it('should return a list of appointment tables', async () => {
      sandbox.stub(Citacion, 'getTables').resolves([{ name: 'appointments' }]);

      const res = await request(app)
        .get('/reservations/ids_appointments')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return success false if no tables are available', async () => {
      sandbox.stub(Citacion, 'getTables').resolves([]);

      const res = await request(app)
        .get('/reservations/ids_appointments')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No hay tablas disponibles');
    });

    it('should return 500 if fetching appointment tables fails', async () => {
      mockClient.query.withArgs(sinon.match.string).throws(new Error('DB Error'));

      const res = await request(app)
        .get('/reservations/ids_appointments')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
    });
  });
});
