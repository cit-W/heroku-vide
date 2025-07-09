import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from '../config/db.js';

import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('Place Routes', () => {
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

  describe('POST /place/create-place', () => {
    it('should create a place successfully', async () => {
      sandbox.stub(Espacio, 'createPlace').resolves({});

      const res = await request(app)
        .post('/place/create-place')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: 1, name: 'Classroom A' });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Espacio creado con éxito');
    });

    it('should return 500 if place creation fails', async () => {
      sandbox.stub(Espacio, 'createPlace').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/place/create-place')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: 1, name: 'Classroom A' });

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .post('/place/create-place')
        .send({ id: 1, name: 'Classroom A' });

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token requerido');
    });
  });

  describe('GET /place/get-places', () => {
    it('should return a list of places', async () => {
      sandbox.stub(Espacio, 'getPlacesByOrganization').resolves([{ place: 'Classroom A' }]);

      const res = await request(app)
        .get('/place/get-places')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 500 if fetching places fails', async () => {
      sandbox.stub(Espacio, 'getPlacesByOrganization').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/place/get-places')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/place/get-places');

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token requerido');
    });
  });

  describe('GET /place/get-single-place', () => {
    it('should return a list of places (same as get-places)', async () => {
      sandbox.stub(Espacio, 'getPlacesByOrganization').resolves([{ place: 'Classroom A' }]);

      const res = await request(app)
        .get('/place/get-single-place')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 500 if fetching single place fails', async () => {
      sandbox.stub(Espacio, 'getPlacesByOrganization').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/place/get-single-place')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/place/get-single-place');

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token requerido');
    });
  });
});
