import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from '../config/db.js';
import * as Student from 'file:///C:/Users/jhoan/Documents/heroku-vide/models/Student.js';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('Student Routes', () => {
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

  describe('POST /students/create-student-user', () => {
    it('should create a student user successfully', async () => {
      sandbox.stub(Student, 'upsertStudentUser').resolves({});

      const res = await request(app)
        .post('/students/create-student-user')
        .set('Authorization', `Bearer ${token}`)
        .send({ personal_id: '123', name: 'Test Student', email: 'student@test.com', password: 'password', grade: '10th' });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Usuario registrado con éxito');
    });

    it('should return 500 if student user creation fails', async () => {
      sandbox.stub(Student, 'upsertStudentUser').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/students/create-student-user')
        .set('Authorization', `Bearer ${token}`)
        .send({ personal_id: '123', name: 'Test Student', email: 'student@test.com', password: 'password', grade: '10th' });

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /students/get-student-record-by-name', () => {
    it('should return student record by name', async () => {
      sandbox.stub(Student, 'getStudentByName').resolves([{ id: 1, name: 'Test Student' }]);

      const res = await request(app)
        .get('/students/get-student-record-by-name?nombre=Test Student')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 400 if name is not provided', async () => {
      const res = await request(app)
        .get('/students/get-student-record-by-name')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('No se proporcionó un nombre válido');
    });

    it('should return success false if student not found by name', async () => {
      sandbox.stub(Student, 'getStudentByName').resolves(null);

      const res = await request(app)
        .get('/students/get-student-record-by-name?nombre=NonExistent')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No se encontraron registros');
    });

    it('should return 500 if fetching student by name fails', async () => {
      sandbox.stub(Student, 'getStudentByName').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/students/get-student-record-by-name?nombre=Test Student')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /students/get-student-record-by-id', () => {
    it('should return student record by ID', async () => {
      sandbox.stub(Student, 'getStudentById').resolves({ id: 1, name: 'Test Student' });

      const res = await request(app)
        .get('/students/get-student-record-by-id?id=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('id', 1);
    });

    it('should return 400 if ID is not provided', async () => {
      const res = await request(app)
        .get('/students/get-student-record-by-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('No se proporcionó un ID válido');
    });

    it('should return success false if student not found by ID', async () => {
      sandbox.stub(Student, 'getStudentById').resolves(null);

      const res = await request(app)
        .get('/students/get-student-record-by-id?id=999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No se encontraron registros');
    });

    it('should return 500 if fetching student by ID fails', async () => {
      sandbox.stub(Student, 'getStudentById').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/students/get-student-record-by-id?id=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('POST /students/delete-students', () => {
    it('should delete students successfully', async () => {
      sandbox.stub(Student, 'deleteStudentsByOrganization').resolves({});

      const res = await request(app)
        .post('/students/delete-students')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Estudiantes eliminados con éxito');
    });

    it('should return 500 if deleting students fails', async () => {
      sandbox.stub(Student, 'deleteStudentsByOrganization').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/students/delete-students')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('POST /students/upload-students', () => {
    it('should upload students successfully', async () => {
      sandbox.stub(Student, 'addStudent').resolves({});

      const studentsData = [
        { name: 'Student A', id: '1', rh: 'O+', grade: '10' },
        { name: 'Student B', id: '2', rh: 'A-', grade: '11' },
      ];

      const res = await request(app)
        .post('/students/upload-students')
        .set('Authorization', `Bearer ${token}`)
        .send(studentsData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Estudiantes agregados correctamente');
    });

    it('should return 400 if data is not an array', async () => {
      const res = await request(app)
        .post('/students/upload-students')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Se esperaba un arreglo de estudiantes');
    });

    it('should return 500 if uploading students fails', async () => {
      mockClient.query.withArgs(sinon.match.string, sinon.match.array).throws(new Error('DB Error'));

      const studentsData = [
        { name: 'Student A', id: '1', rh: 'O+', grade: '10' },
      ];

      const res = await request(app)
        .post('/students/upload-students')
        .set('Authorization', `Bearer ${token}`)
        .send(studentsData);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });
});
