import request from 'supertest';
import { expect } from 'chai';
import app from '../app.js';
import jwt from 'jsonwebtoken';
import sinon from 'sinon';
import pool from '../config/db.js';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('User Routes', () => {
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

  describe('GET /user-reservations/get-reservation-ids', () => {
    it('should return reservation IDs if authenticated', async () => {
      const testUser = { userId: 1, orgId: 101 };
      const token = jwt.sign(testUser, SECRET_KEY, { expiresIn: '1h' });

      mockClient.query.withArgs('SET app.current_org_id = $1', [testUser.orgId]).resolves();
      mockClient.query.withArgs('SELECT * FROM reservation_details WHERE organizacion_id = $1 ORDER BY place;', [testUser.orgId]).resolves({ rows: [{ id: 1, name: 'Reserva 1' }] });

      const res = await request(app)
        .get('/user-reservations/get-reservation-ids')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
      expect(mockClient.query.calledWith('SET app.current_org_id = $1', [testUser.orgId])).to.be.true;
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/user-reservations/get-reservation-ids');

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token requerido');
    });

    it('should return 401 if token is invalid', async () => {
      const res = await request(app)
        .get('/user-reservations/get-reservation-ids')
        .set('Authorization', `Bearer invalidtoken`);

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token inválido o expirado');
    });
  });

  describe('POST /user-reservations/report-reservation', () => {
    const validReportData = {
      clase: 'Matemáticas',
      lugar: 'Aula 101',
      hora_inicio: new Date().toISOString(),
      hora_final: new Date(Date.now() + 3600000).toISOString(), // 1 hora después
    };

    it('should report a reservation with valid data', async () => {
      const testUser = { userId: 1, orgId: 101 };
      const token = jwt.sign(testUser, SECRET_KEY, { expiresIn: '1h' });

      mockClient.query.withArgs('SET app.current_org_id = $1', [testUser.orgId]).resolves();
      // Mock resolveNamesToIds if it makes DB calls
      mockClient.query.withArgs(sinon.match.string, sinon.match.array).resolves({ rows: [{ grade_id: 1, place_id: 1 }] });

      const res = await request(app)
        .post('/user-reservations/report-reservation')
        .set('Authorization', `Bearer ${token}`)
        .send(validReportData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.equal('Reporte registrado con éxito');
    });

    it('should return 400 with validation errors for invalid data', async () => {
      const testUser = { userId: 1, orgId: 101 };
      const token = jwt.sign(testUser, SECRET_KEY, { expiresIn: '1h' });

      const invalidReportData = {
        clase: '',
        lugar: 'Aula 101',
        hora_inicio: 'not-a-date',
        hora_final: new Date(Date.now() + 3600000).toISOString(),
      };

      const res = await request(app)
        .post('/user-reservations/report-reservation')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidReportData);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.errors).to.be.an('array').that.is.not.empty;
      expect(res.body.errors[0].msg).to.equal('La clase es requerida');
      expect(res.body.errors[1].msg).to.equal('La hora de inicio debe ser una fecha y hora válida en formato ISO8601');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .post('/user-reservations/report-reservation')
        .send(validReportData);

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token requerido');
    });
  });

  describe('POST /user-reservations/book-place', () => {
    const validBookData = {
      clase: 'Historia',
      lugar: 'Biblioteca',
      hora_inicio: new Date().toISOString(),
      hora_final: new Date(Date.now() + 7200000).toISOString(), // 2 horas después
    };

    it('should book a place with valid data', async () => {
      const testUser = { userId: 1, orgId: 101 };
      const token = jwt.sign(testUser, SECRET_KEY, { expiresIn: '1h' });

      mockClient.query.withArgs('SET app.current_org_id = $1', [testUser.orgId]).resolves();
      mockClient.query.withArgs(sinon.match.string, sinon.match.array).resolves({ rows: [{ grade_id: 1, place_id: 1 }] });

      const res = await request(app)
        .post('/user-reservations/book-place')
        .set('Authorization', `Bearer ${token}`)
        .send(validBookData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.equal('Reserva registrada con éxito');
    });

    it('should return 400 with validation errors for invalid data', async () => {
      const testUser = { userId: 1, orgId: 101 };
      const token = jwt.sign(testUser, SECRET_KEY, { expiresIn: '1h' });

      const invalidBookData = {
        clase: '',
        lugar: 'Biblioteca',
        hora_inicio: 'invalid-date',
        hora_final: new Date(Date.now() + 7200000).toISOString(),
      };

      const res = await request(app)
        .post('/user-reservations/book-place')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidBookData);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.errors).to.be.an('array').that.is.not.empty;
      expect(res.body.errors[0].msg).to.equal('La clase es requerida');
      expect(res.body.errors[1].msg).to.equal('La hora de inicio debe ser una fecha y hora válida en formato ISO8601');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .post('/user-reservations/book-place')
        .send(validBookData);

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token requerido');
    });
  });
});