import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from 'file:///C:/Users/jhoan/Documents/heroku-vide/config/db.js';
import jwt from 'jsonwebtoken';
import * as Role from '../models/Role.js';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('Role Routes', () => {
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
    mockClient.query.withArgs('SET app.current_org_id = $1', [testUser.orgId]).resolves();
    token = jwt.sign(testUser, SECRET_KEY, { expiresIn: '1h' });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('POST /role/create-role', () => {
    const roleData = {
      role_code: 10,
      role_name: 'New Role',
    };

    it('should create a role successfully', async () => {
      sandbox.stub(Role, 'createRole').resolves({});

      const res = await request(app)
        .post('/role/create-role')
        .set('Authorization', `Bearer ${token}`)
        .send(roleData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Rol creado con éxito');
      expect(Role.createRole.calledOnceWith(
        { ...roleData, organizacion_id: testUser.orgId },
        mockClient
      )).to.be.true;
    });

    it('should return 500 if createRole fails', async () => {
      sandbox.stub(Role, 'createRole').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/role/create-role')
        .set('Authorization', `Bearer ${token}`)
        .send(roleData);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /role/get-roles', () => {
    const mockRoles = [{ id: 1, role_name: 'Admin' }, { id: 2, role_name: 'User' }];

    it('should return all roles successfully', async () => {
      sandbox.stub(Role, 'getRolesByOrganization').resolves(mockRoles);

      const res = await request(app)
        .get('/role/get-roles')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockRoles);
      expect(Role.getRolesByOrganization.calledOnceWith(testUser.orgId, mockClient)).to.be.true;
    });

    it('should return 500 if getRolesByOrganization fails', async () => {
      sandbox.stub(Role, 'getRolesByOrganization').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/role/get-roles')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /role/roles-in-organization', () => {
    const mockCount = 5;

    it('should return the count of roles in the organization successfully', async () => {
      sandbox.stub(Role, 'countRolesByOrganization').resolves(mockCount);

      const res = await request(app)
        .get('/role/roles-in-organization')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.count).to.equal(mockCount);
      expect(Role.countRolesByOrganization.calledOnceWith(testUser.orgId, mockClient)).to.be.true;
    });

    it('should return 500 if countRolesByOrganization fails', async () => {
      sandbox.stub(Role, 'countRolesByOrganization').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/role/roles-in-organization')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });
});