import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from 'file:///C:/Users/jhoan/Documents/heroku-vide/config/db.js';
import jwt from 'jsonwebtoken';
import * as Departamento from '../models/Departamento.js';
import User from '../models/User.js';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('Department Routes', () => {
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

  describe('POST /department/create-department', () => {
    const departmentData = {
      id: 1,
      name: 'Ciencias',
    };

    it('should create a department successfully', async () => {
      sandbox.stub(Departamento, 'createDepartment').resolves({});

      const res = await request(app)
        .post('/department/create-department')
        .set('Authorization', `Bearer ${token}`)
        .send(departmentData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Departamento creado con éxito');
      expect(Departamento.createDepartment.calledOnceWith(
        { ...departmentData, organizacion_id: testUser.orgId },
        mockClient
      )).to.be.true;
    });

    it('should return 500 if createDepartment fails', async () => {
      sandbox.stub(Departamento, 'createDepartment').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/department/create-department')
        .set('Authorization', `Bearer ${token}`)
        .send(departmentData);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /department/get-departments', () => {
    const mockDepartments = [{ department: 'Ciencias' }, { department: 'Humanidades' }];

    it('should return all departments successfully', async () => {
      sandbox.stub(Departamento, 'getDepartmentsByOrganization').resolves(mockDepartments);

      const res = await request(app)
        .get('/department/get-departments')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockDepartments);
      expect(Departamento.getDepartmentsByOrganization.calledOnceWith(testUser.orgId, mockClient)).to.be.true;
    });

    it('should return 500 if getDepartmentsByOrganization fails', async () => {
      sandbox.stub(Departamento, 'getDepartmentsByOrganization').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/department/get-departments')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /department/get-single-department', () => {
    const mockDepartments = [{ department: 'Ciencias' }];

    it('should return a single department successfully', async () => {
      sandbox.stub(Departamento, 'getDepartmentsByOrganization').resolves(mockDepartments);

      const res = await request(app)
        .get('/department/get-single-department')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockDepartments);
      expect(Departamento.getDepartmentsByOrganization.calledOnceWith(testUser.orgId, mockClient)).to.be.true;
    });

    it('should return 500 if getDepartmentsByOrganization fails', async () => {
      sandbox.stub(Departamento, 'getDepartmentsByOrganization').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/department/get-single-department')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /department/users-by-department/:departmentName', () => {
    const departmentName = 'Ciencias';
    const mockUsers = [
      { id: 1, personal_id: '123', name: 'User A', email: 'a@example.com', personal_permissions: true },
      { id: 2, personal_id: '456', name: 'User B', email: 'b@example.com', personal_permissions: false },
    ];

    it('should return users by department successfully', async () => {
      sandbox.stub(User, 'getUsersByDepartmentAndOrganization').resolves(mockUsers);

      const res = await request(app)
        .get(`/department/users-by-department/${departmentName}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockUsers);
      expect(User.getUsersByDepartmentAndOrganization.calledOnceWith(departmentName, testUser.orgId, mockClient)).to.be.true;
    });

    it('should return 400 if departmentName is missing', async () => {
      const res = await request(app)
        .get('/department/users-by-department/')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('El nombre del departamento es requerido.');
    });

    it('should return 500 if getUsersByDepartmentAndOrganization fails', async () => {
      sandbox.stub(User, 'getUsersByDepartmentAndOrganization').throws(new Error('DB Error'));

      const res = await request(app)
        .get(`/department/users-by-department/${departmentName}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });
});