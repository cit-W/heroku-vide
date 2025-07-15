import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from '../config/db.js';

import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('Role Routes', () => {
  let sandbox;
  let mockClient;
  let token;
  const testUser = { userId: 1, orgId: 101 };
  let poolQueryStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mockClient = {
      query: sandbox.stub(),
      release: sandbox.stub(),
    };
    sandbox.stub(pool, 'connect').resolves(mockClient);
    poolQueryStub = sandbox.stub(pool, 'query');
    token = jwt.sign(testUser, SECRET_KEY, { expiresIn: '1h' });
    mockClient.query.withArgs('SET app.current_org_id = $1', [testUser.orgId]).resolves();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('POST /role/create-role', () => {
    it('should create a role successfully', async () => {
      mockClient.query.withArgs(sinon.match.string, [0, 'Admin', testUser.orgId]).resolves();

      const res = await request(app)
        .post('/role/create-role')
        .set('Authorization', `Bearer ${token}`)
        .send({ role_code: 0, role_name: 'Admin' });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Rol creado con éxito');
    });

    it('should return 500 if role creation fails', async () => {
      mockClient.query.withArgs(sinon.match.string, [0, 'Admin', testUser.orgId]).throws(new Error('DB Error'));

      const res = await request(app)
        .post('/role/create-role')
        .set('Authorization', `Bearer ${token}`)
        .send({ role_code: 0, role_name: 'Admin' });

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .post('/role/create-role')
        .send({ role_code: 0, role_name: 'Admin' });

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token requerido');
    });
  });

  describe('GET /role/get-roles', () => {
    it('should return a list of roles', async () => {
      sandbox.stub(Role, 'getRolesByOrganization').resolves([{ role: 'Admin' }]);

      const res = await request(app)
        .get('/role/get-roles')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 500 if fetching roles fails', async () => {
      sandbox.stub(Role, 'getRolesByOrganization').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/role/get-roles')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/role/get-roles');

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token requerido');
    });
  });

  describe('GET /role/get-single-role', () => {
    it('should return a list of roles (same as get-roles)', async () => {
      sandbox.stub(Role, 'getRolesByOrganization').resolves([{ role: 'Admin' }]);

      const res = await request(app)
        .get('/role/get-single-role')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 500 if fetching single role fails', async () => {
      sandbox.stub(Role, 'getRolesByOrganization').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/role/get-single-role')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/role/get-single-role');

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token requerido');
    });
  });
});
