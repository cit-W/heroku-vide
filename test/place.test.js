import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from 'file:///C:/Users/jhoan/Documents/heroku-vide/config/db.js';
import jwt from 'jsonwebtoken';
import * as Espacio from '../models/Espacio.js';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('Place Routes', () => {
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

  describe('POST /place/create-place', () => {
    const placeData = {
      place: 'Auditorio Principal',
    };

    it('should create a place successfully', async () => {
      sandbox.stub(Espacio, 'createPlace').resolves({});

      const res = await request(app)
        .post('/place/create-place')
        .set('Authorization', `Bearer ${token}`)
        .send(placeData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Espacio creado con éxito');
      expect(Espacio.createPlace.calledOnceWith(
        { ...placeData, organizacion_id: testUser.orgId },
        mockClient
      )).to.be.true;
    });

    it('should return 500 if createPlace fails', async () => {
      sandbox.stub(Espacio, 'createPlace').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/place/create-place')
        .set('Authorization', `Bearer ${token}`)
        .send(placeData);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /place/get-places', () => {
    const mockPlaces = [{ id: 1, place: 'Auditorio' }, { id: 2, place: 'Biblioteca' }];

    it('should return all places successfully', async () => {
      sandbox.stub(Espacio, 'getPlacesByOrganization').resolves(mockPlaces);

      const res = await request(app)
        .get('/place/get-places')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockPlaces);
      expect(Espacio.getPlacesByOrganization.calledOnceWith(testUser.orgId, mockClient)).to.be.true;
    });

    it('should return 500 if getPlacesByOrganization fails', async () => {
      sandbox.stub(Espacio, 'getPlacesByOrganization').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/place/get-places')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /place/get-single-place', () => {
    const mockPlaces = [{ id: 1, place: 'Auditorio' }];

    it('should return a single place successfully', async () => {
      sandbox.stub(Espacio, 'getPlacesByOrganization').resolves(mockPlaces);

      const res = await request(app)
        .get('/place/get-single-place')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockPlaces);
      expect(Espacio.getPlacesByOrganization.calledOnceWith(testUser.orgId, mockClient)).to.be.true;
    });

    it('should return 500 if getPlacesByOrganization fails', async () => {
      sandbox.stub(Espacio, 'getPlacesByOrganization').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/place/get-single-place')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });
});