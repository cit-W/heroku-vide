import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from 'file:///C:/Users/jhoan/Documents/heroku-vide/config/db.js';

describe('General Routes', () => {
  let sandbox;
  let poolQueryStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    poolQueryStub = sandbox.stub(pool, 'query');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('GET /general/connection-verification', () => {
    it('should return success true if connection is verified', async () => {
      poolQueryStub.withArgs('SELECT 1;').resolves({ rows: [{ '?column?': 1 }] });

      const res = await request(app).get('/general/connection-verification');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    it('should return 500 if connection verification fails', async () => {
      poolQueryStub.withArgs('SELECT 1;').throws(new Error('DB Error'));

      const res = await request(app).get('/general/connection-verification');

      expect(res.statusCode).to.equal(500);
      expect(res.body.error).to.equal('Error en la verificación de conexión');
    });
  });

  describe('POST /general/create-organization', () => {
    it('should create an organization successfully', async () => {
      poolQueryStub.withArgs(sinon.match.string, sinon.match.array).resolves({}); 

      const res = await request(app)
        .post('/general/create-organization')
        .send({ id: 'org123', name: 'Test Org', contact: 'test@org.com', statusId: 1, expiresAt: '2025-12-31' });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Organización creada con éxito');
    });

    it('should return 500 if organization creation fails', async () => {
      poolQueryStub.withArgs(sinon.match.string, sinon.match.array).throws(new Error('DB Error'));

      const res = await request(app)
        .post('/general/create-organization')
        .send({ id: 'org123', name: 'Test Org', contact: 'test@org.com', statusId: 1, expiresAt: '2025-12-31' });

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Error al crear la organización');
    });
  });

  describe('GET /general/get-organizations', () => {
    it('should return a list of organizations', async () => {
      poolQueryStub.withArgs('SELECT * FROM organizations ORDER BY name').resolves({ rows: [{ id: 'org1', name: 'Org 1' }] });

      const res = await request(app).get('/general/get-organizations');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 500 if fetching organizations fails', async () => {
      poolQueryStub.withArgs('SELECT * FROM organizations ORDER BY name').throws(new Error('DB Error'));

      const res = await request(app).get('/general/get-organizations');

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Error al obtener organizations');
    });
  });

  describe('GET /general/get-users', () => {
    it('should return a list of users for a given organization', async () => {
      poolQueryStub.withArgs(sinon.match.string, ['org123']).resolves({ rows: [{ id: 1, name: 'User 1' }] });

      const res = await request(app).get('/general/get-users?organizacion_id=org123');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 500 if fetching users fails', async () => {
      poolQueryStub.withArgs(sinon.match.string, ['org123']).throws(new Error('DB Error'));

      const res = await request(app).get('/general/get-users?organizacion_id=org123');

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Error al obtener usuarios');
    });
  });

  describe('GET /general/user-info', () => {
    it('should return user info for a given email', async () => {
      poolQueryStub.withArgs(sinon.match.string, ['test@example.com']).resolves({ rows: [{ email: 'test@example.com', name: 'Test User' }] });

      const res = await request(app).get('/general/user-info?email=test@example.com');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('email', 'test@example.com');
    });

    it('should return success false if user not found', async () => {
      poolQueryStub.withArgs(sinon.match.string, ['nonexistent@example.com']).resolves({ rows: [] });

      const res = await request(app).get('/general/user-info?email=nonexistent@example.com');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No se encontró usuario');
    });

    it('should return 400 if email is not provided', async () => {
      const res = await request(app).get('/general/user-info');

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('No se proporcionó una cédula válida');
    });

    it('should return 500 if fetching user info fails', async () => {
      poolQueryStub.withArgs(sinon.match.string, ['test@example.com']).throws(new Error('DB Error'));

      const res = await request(app).get('/general/user-info?email=test@example.com');

      expect(res.statusCode).to.equal(500);
      expect(res.body.error).to.equal('Error al obtener la información del usuario');
    });
  });
});