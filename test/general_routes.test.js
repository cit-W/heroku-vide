import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from 'file:///C:/Users/jhoan/Documents/heroku-vide/config/db.js';
import * as Organizacion from '../models/Organizacion.js';
import User from '../models/User.js';
import * as General from '../models/General.js';

describe('General Routes', () => {
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

  describe('GET /general/connection-verification', () => {
    it('should return success true if connection is verified', async () => {
      sandbox.stub(General, 'checkConnection').resolves([{ '1': 1 }]);

      const res = await request(app).get('/general/connection-verification');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(General.checkConnection.calledOnce).to.be.true;
    });

    it('should return 500 if connection verification fails', async () => {
      sandbox.stub(General, 'checkConnection').throws(new Error('DB Connection Error'));

      const res = await request(app).get('/general/connection-verification');

      expect(res.statusCode).to.equal(500);
      expect(res.body.error).to.equal('Error en la verificación de conexión');
    });
  });

  describe('POST /general/create-organization', () => {
    const orgData = {
      id: 'new_org_id',
      name: 'New Organization',
      contact: 'new@org.com',
      status_id: 1,
      expires_at: '2026-12-31',
    };

    it('should create an organization successfully', async () => {
      sandbox.stub(Organizacion, 'createOrganization').resolves({});

      const res = await request(app)
        .post('/general/create-organization')
        .send(orgData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Organización creada con éxito');
      expect(Organizacion.createOrganization.calledOnceWith(orgData)).to.be.true;
    });

    it('should return 500 if organization creation fails', async () => {
      sandbox.stub(Organizacion, 'createOrganization').throws(new Error('Org Creation Error'));

      const res = await request(app)
        .post('/general/create-organization')
        .send(orgData);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Error al crear la organización');
    });
  });

  describe('GET /general/get-organizations', () => {
    const mockOrgs = [{ id: 'org1', name: 'Org One' }, { id: 'org2', name: 'Org Two' }];

    it('should return all organizations successfully', async () => {
      sandbox.stub(Organizacion, 'getOrganizations').resolves(mockOrgs);

      const res = await request(app).get('/general/get-organizations');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockOrgs);
      expect(Organizacion.getOrganizations.calledOnce).to.be.true;
    });

    it('should return 500 if fetching organizations fails', async () => {
      sandbox.stub(Organizacion, 'getOrganizations').throws(new Error('Get Orgs Error'));

      const res = await request(app).get('/general/get-organizations');

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Error al obtener organizations');
    });
  });

  describe('GET /general/get-users', () => {
    const mockUsers = [{ id: 1, name: 'User A' }, { id: 2, name: 'User B' }];
    const orgId = 'test_org_id';

    it('should return users by organization ID successfully', async () => {
      sandbox.stub(User, 'getUsersByOrganization').resolves(mockUsers);

      const res = await request(app).get(`/general/get-users?organizacion_id=${orgId}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockUsers);
      expect(User.getUsersByOrganization.calledOnceWith(orgId)).to.be.true;
    });

    it('should return 500 if fetching users fails', async () => {
      sandbox.stub(User, 'getUsersByOrganization').throws(new Error('Get Users Error'));

      const res = await request(app).get(`/general/get-users?organizacion_id=${orgId}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Error al obtener usuarios');
    });
  });
});