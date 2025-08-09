import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from 'file:///C:/Users/jhoan/Documents/heroku-vide/config/db.js';
import jwt from 'jsonwebtoken';
import * as Student from '../models/Student.js';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('Student Routes', () => {
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
    mockClient.query.withArgs('SET app.current_org_id = $1, false', [testUser.orgId]).resolves();
    token = jwt.sign(testUser, SECRET_KEY, { expiresIn: '1h' });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('POST /students/create-student-user', () => {
    const studentUserData = {
      personal_id: '123',
      email: 'student@example.com',
      password: 'password123',
      role_id: 3,
    };

    it('should create a student user successfully', async () => {
      sandbox.stub(Student, 'upsertStudentUser').resolves({});

      const res = await request(app)
        .post('/students/create-student-user')
        .set('Authorization', `Bearer ${token}`)
        .send(studentUserData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Usuario registrado con éxito');
      expect(Student.upsertStudentUser.calledOnceWith(
        { ...studentUserData, organizacion_id: testUser.orgId },
        mockClient
      )).to.be.true;
    });

    it('should return 500 if upsertStudentUser fails', async () => {
      sandbox.stub(Student, 'upsertStudentUser').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/students/create-student-user')
        .set('Authorization', `Bearer ${token}`)
        .send(studentUserData);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /students/get-student-record-by-name', () => {
    const studentName = 'Test Student';
    const mockStudent = [{ id: 1, name: studentName }];

    it('should return student record by name successfully', async () => {
      sandbox.stub(Student, 'getStudentByName').resolves(mockStudent);

      const res = await request(app)
        .get(`/students/get-student-record-by-name?name=${studentName}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockStudent);
      expect(Student.getStudentByName.calledOnceWith(studentName, testUser.orgId, mockClient)).to.be.true;
    });

    it('should return no records message if student not found', async () => {
      sandbox.stub(Student, 'getStudentByName').resolves(null);

      const res = await request(app)
        .get(`/students/get-student-record-by-name?name=NonExistent`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No se encontraron registros');
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app)
        .get(`/students/get-student-record-by-name`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('No se proporcionó un nombre válido');
    });

    it('should return 500 if getStudentByName fails', async () => {
      sandbox.stub(Student, 'getStudentByName').throws(new Error('DB Error'));

      const res = await request(app)
        .get(`/students/get-student-record-by-name?name=${studentName}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /students/get-student-record-by-id', () => {
    const studentId = 1;
    const mockStudent = [{ id: studentId, name: 'Test Student' }];

    it('should return student record by id successfully', async () => {
      sandbox.stub(Student, 'getStudentById').resolves(mockStudent);

      const res = await request(app)
        .get(`/students/get-student-record-by-id?id=${studentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockStudent);
      expect(Student.getStudentById.calledOnceWith(studentId, testUser.orgId, mockClient)).to.be.true;
    });

    it('should return no records message if student not found', async () => {
      sandbox.stub(Student, 'getStudentById').resolves(null);

      const res = await request(app)
        .get(`/students/get-student-record-by-id?id=999`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No se encontraron registros');
    });

    it('should return 400 if id is missing', async () => {
      const res = await request(app)
        .get(`/students/get-student-record-by-id`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('No se proporcionó un ID válido');
    });

    it('should return 500 if getStudentById fails', async () => {
      sandbox.stub(Student, 'getStudentById').throws(new Error('DB Error'));

      const res = await request(app)
        .get(`/students/get-student-record-by-id?id=${studentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('POST /students/delete-students', () => {
    it('should delete students by organization successfully', async () => {
      sandbox.stub(Student, 'deleteStudentsByOrganization').resolves({});

      const res = await request(app)
        .post('/students/delete-students')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Estudiantes eliminados con éxito');
      expect(Student.deleteStudentsByOrganization.calledOnceWith(testUser.orgId, mockClient)).to.be.true;
    });

    it('should return 500 if deleteStudentsByOrganization fails', async () => {
      sandbox.stub(Student, 'deleteStudentsByOrganization').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/students/delete-students')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('POST /students/upload-students', () => {
    const studentsToUpload = [
      { name: 'Student A', id: '101', rh: 'O+', department_id: 1 },
      { name: 'Student B', id: '102', rh: 'A-', department_id: 2 },
    ];

    it('should upload students successfully', async () => {
      sandbox.stub(Student, 'addStudent').resolves({});

      const res = await request(app)
        .post('/students/upload-students')
        .set('Authorization', `Bearer ${token}`)
        .send(studentsToUpload);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Estudiantes agregados correctamente');
      expect(Student.addStudent.callCount).to.equal(studentsToUpload.length);
      expect(Student.addStudent.firstCall.calledWith(
        { ...studentsToUpload[0], organizacion_id: testUser.orgId },
        mockClient
      )).to.be.true;
    });

    it('should return 400 if body is not an array', async () => {
      const res = await request(app)
        .post('/students/upload-students')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Se esperaba un arreglo de estudiantes');
    });

    it('should skip students with missing name or id', async () => {
      const partialStudents = [
        { name: 'Student C', id: '103', rh: 'B+', department_id: 1 },
        { name: 'Student D', rh: 'AB+', department_id: 2 }, // Missing id
        { id: '105', rh: 'O-', department_id: 3 }, // Missing name
      ];
      sandbox.stub(Student, 'addStudent').resolves({});

      const res = await request(app)
        .post('/students/upload-students')
        .set('Authorization', `Bearer ${token}`)
        .send(partialStudents);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(Student.addStudent.callCount).to.equal(1); // Only Student C should be added
    });

    it('should return 500 if addStudent fails', async () => {
      sandbox.stub(Student, 'addStudent').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/students/upload-students')
        .set('Authorization', `Bearer ${token}`)
        .send(studentsToUpload);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /students/by-department/:department', () => {
    const departmentName = 'Ciencias';
    const mockStudents = [{ id: 1, name: 'Student X', department: departmentName }];

    it('should return students by department successfully', async () => {
      sandbox.stub(Student, 'getStudentsByDepartment').resolves(mockStudents);

      const res = await request(app)
        .get(`/students/by-department/${departmentName}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockStudents);
      expect(Student.getStudentsByDepartment.calledOnceWith(departmentName, testUser.orgId, mockClient)).to.be.true;
    });

    it('should return 400 if department name is missing', async () => {
      const res = await request(app)
        .get(`/students/by-department/`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('No se proporcionó un ID de departamento válido');
    });

    it('should return 500 if getStudentsByDepartment fails', async () => {
      sandbox.stub(Student, 'getStudentsByDepartment').throws(new Error('DB Error'));

      const res = await request(app)
        .get(`/students/by-department/${departmentName}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });
});