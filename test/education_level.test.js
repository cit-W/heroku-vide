import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from '../config/db.js';

import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('Education Level Routes', () => {
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

  describe('POST /education-level/create-education-level', () => {
    it('should create an education level successfully', async () => {
      sandbox.stub(Escuela, 'createEducationLevel').resolves({});

      const res = await request(app)
        .post('/education-level/create-education-level')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: 1, name: 'High School' });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Escuela creada con éxito');
    });

    it('should return 500 if education level creation fails', async () => {
      mockClient.query.withArgs(sinon.match.string, sinon.match.array).throws(new Error('DB Error'));

      const res = await request(app)
        .post('/education-level/create-education-level')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: 1, name: 'High School' });

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .post('/education-level/create-education-level')
        .send({ id: 1, name: 'High School' });

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token requerido');
    });
  });

  describe('GET /education-level/get-education-levels', () => {
    it('should return a list of education levels', async () => {
      sandbox.stub(Escuela, 'getEducationLevelsByOrganization').resolves([{ level: 'High School' }]);

      const res = await request(app)
        .get('/education-level/get-education-levels')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 500 if fetching education levels fails', async () => {
      sandbox.stub(Escuela, 'getEducationLevelsByOrganization').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/education-level/get-education-levels')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/education-level/get-education-levels');

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token requerido');
    });
  });

  describe('GET /education-level/get-single-education-level', () => {
    it('should return a list of education levels (same as get-education-levels)', async () => {
      sandbox.stub(Escuela, 'getEducationLevelsByOrganization').resolves([{ level: 'High School' }]);

      const res = await request(app)
        .get('/education-level/get-single-education-level')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 500 if fetching single education level fails', async () => {
      sandbox.stub(Escuela, 'getEducationLevelsByOrganization').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/education-level/get-single-education-level')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/education-level/get-single-education-level');

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token requerido');
    });
  });
});
