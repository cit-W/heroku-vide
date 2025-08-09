import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from 'file:///C:/Users/jhoan/Documents/heroku-vide/config/db.js';
import jwt from 'jsonwebtoken';
import * as Citacion from '../models/Citacion.js';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('Appointments Routes', () => {
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
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('POST /reservations/create-citation', () => {
    const citationData = {
      topic: 'Reunión de seguimiento',
      student_id: 101,
      date: '2025-08-01T10:00:00Z',
    };

    it('should create a citation successfully', async () => {
      sandbox.stub(Citacion, 'createAppointment').resolves({});

      const res = await request(app)
        .post('/reservations/create-citation')
        .set('Authorization', `Bearer ${token}`)
        .send(citationData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Citación creada con éxito');
      expect(Citacion.createAppointment.calledOnceWith(
        { ...citationData, organizacion_id: testUser.orgId },
        testUser.userId,
        mockClient
      )).to.be.true;
    });

    it('should return 500 if createAppointment fails', async () => {
      sandbox.stub(Citacion, 'createAppointment').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/reservations/create-citation')
        .set('Authorization', `Bearer ${token}`)
        .send(citationData);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /reservations/get-citations', () => {
    const mockAppointments = [{ id: 1, topic: 'Topic 1' }, { id: 2, topic: 'Topic 2' }];

    it('should return appointments by status successfully', async () => {
      sandbox.stub(Citacion, 'getAppointments').resolves(mockAppointments);

      const res = await request(app)
        .get('/reservations/get-citations?status=Pendiente')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockAppointments);
      expect(Citacion.getAppointments.calledOnceWith(
        testUser.userId, 'Pendiente', testUser.orgId, mockClient
      )).to.be.true;
    });

    it('should return no hay citas message if no appointments found', async () => {
      sandbox.stub(Citacion, 'getAppointments').resolves([]);

      const res = await request(app)
        .get('/reservations/get-citations?status=Completado')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No hay citas');
    });

    it('should return 400 if status is missing', async () => {
      const res = await request(app)
        .get('/reservations/get-citations')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('Faltan parámetros');
    });

    it('should return 500 if getAppointments fails', async () => {
      sandbox.stub(Citacion, 'getAppointments').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/reservations/get-citations?status=Pendiente')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('PUT /reservations/update-citation', () => {
    const updateData = {
      id: 1,
      status: 'Completado',
    };

    it('should update a citation successfully', async () => {
      sandbox.stub(Citacion, 'updateAppointment').resolves({});

      const res = await request(app)
        .put('/reservations/update-citation')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Citación actualizada');
      expect(Citacion.updateAppointment.calledOnceWith(
        { ...updateData, organizacion_id: testUser.orgId },
        mockClient
      )).to.be.true;
    });

    it('should return 500 if updateAppointment fails', async () => {
      sandbox.stub(Citacion, 'updateAppointment').throws(new Error('DB Error'));

      const res = await request(app)
        .put('/reservations/update-citation')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /reservations/ids_appointments', () => {
    const mockTables = [{ id: 1, name: 'Table 1' }];

    it('should return available tables successfully', async () => {
      sandbox.stub(Citacion, 'getTables').resolves(mockTables);

      const res = await request(app)
        .get('/reservations/ids_appointments')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockTables);
      expect(Citacion.getTables.calledOnceWith(testUser.orgId, mockClient)).to.be.true;
    });

    it('should return no hay tablas disponibles message if no tables found', async () => {
      sandbox.stub(Citacion, 'getTables').resolves([]);

      const res = await request(app)
        .get('/reservations/ids_appointments')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No hay tablas disponibles');
    });

    it('should return 500 if getTables fails', async () => {
      sandbox.stub(Citacion, 'getTables').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/reservations/ids_appointments')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });
});