import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from 'file:///C:/Users/jhoan/Documents/heroku-vide/config/db.js';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('Department Routes', () => {
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

    mockClient.query.withArgs('SET app.current_org_id = $1', [testUser.orgId]).resolves({});
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('POST /department/create-department', () => {
    it('should create a department successfully', async () => {
      mockClient.query.withArgs(sinon.match.string, [1, 'Test Department', testUser.orgId]).resolves({});

      const res = await request(app)
        .post('/department/create-department')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: 1, name: 'Test Department' });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Departamento creado con éxito');
    });

    it('should return 500 if department creation fails', async () => {
      mockClient.query.withArgs(sinon.match.string, [1, 'Test Department', testUser.orgId]).throws(new Error('DB Error'));

      const res = await request(app)
        .post('/department/create-department')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: 1, name: 'Test Department' });

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .post('/department/create-department')
        .send({ id: 1, name: 'Test Department' });

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token requerido');
    });
  });

  describe('GET /department/get-departments', () => {
    it('should return a list of departments', async () => {
      mockClient.query.withArgs(sinon.match.string, [testUser.orgId]).resolves({ rows: [{ department: 'Dept 1' }] });

      const res = await request(app)
        .get('/department/get-departments')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 500 if fetching departments fails', async () => {
      mockClient.query.withArgs(sinon.match.string, [testUser.orgId]).throws(new Error('DB Error'));

      const res = await request(app)
        .get('/department/get-departments')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/department/get-departments');

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token requerido');
    });
  });

  describe('GET /department/get-single-department', () => {
    it('should return a list of departments (same as get-departments)', async () => {
      mockClient.query.withArgs(sinon.match.string, [testUser.orgId]).resolves({ rows: [{ department: 'Dept 1' }] });

      const res = await request(app)
        .get('/department/get-single-department')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 500 if fetching single department fails', async () => {
      mockClient.query.withArgs(sinon.match.string, [testUser.orgId]).throws(new Error('DB Error'));

      const res = await request(app)
        .get('/department/get-single-department')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/department/get-single-department');

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token requerido');
    });
  });
});