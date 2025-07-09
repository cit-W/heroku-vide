import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from '../config/db.js';
import * as Grado from 'file:///C:/Users/jhoan/Documents/heroku-vide/models/Grado.js';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('Grade Routes', () => {
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

  describe('POST /grade/create-grade', () => {
    it('should create a grade successfully', async () => {
      sandbox.stub(Grado, 'createGrade').resolves({});

      const res = await request(app)
        .post('/grade/create-grade')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: 1, name: '10th Grade' });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Grado creado con éxito');
    });

    it('should return 500 if grade creation fails', async () => {
      mockClient.query.withArgs(sinon.match.string, [1, '10th Grade', testUser.orgId]).throws(new Error('DB Error'));

      const res = await request(app)
        .post('/grade/create-grade')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: 1, name: '10th Grade' });

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .post('/grade/create-grade')
        .send({ id: 1, name: '10th Grade' });

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token requerido');
    });
  });

  describe('GET /grade/get-grades', () => {
    it('should return a list of grades', async () => {
      sandbox.stub(Grado, 'getGradesByOrganization').resolves([{ id: 1, grade: '10th Grade' }]);

      const res = await request(app)
        .get('/grade/get-grades')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 500 if fetching grades fails', async () => {
      sandbox.stub(Grado, 'getGradesByOrganization').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/grade/get-grades')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/grade/get-grades');

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token requerido');
    });
  });

  describe('GET /grade/get-single-grade', () => {
    it('should return a list of grades (same as get-grades)', async () => {
      sandbox.stub(Grado, 'getGradesByOrganization').resolves([{ id: 1, grade: '10th Grade' }]);

      const res = await request(app)
        .get('/grade/get-single-grade')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 500 if fetching single grade fails', async () => {
      sandbox.stub(Grado, 'getGradesByOrganization').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/grade/get-single-grade')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/grade/get-single-grade');

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token requerido');
    });
  });
});
