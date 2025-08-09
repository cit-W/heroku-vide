import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from 'file:///C:/Users/jhoan/Documents/heroku-vide/config/db.js';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('AI Counselor Routes', () => {
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

  describe('POST /api/ai/counselor/ask', () => {
    const studentId = 123;
    const query = 'Tell me about this student.';
    const mockStudentProfile = {
      student_info: { nombre: 'Test Student', department: 'Ciencias' },
      attendance_summary: { ausencias: 5 },
      incidents_summary: { citaciones_negativas: 2, citaciones_positivas: 1 },
      recent_observations: [{ comentario: 'Good progress', fecha: '2024-07-26' }],
    };
    const mockAIResponse = { response: 'AI Counselor response here.' };

    it('should return AI counselor response successfully', async () => {
      // Mock database queries for getStudentProfileForAI
      mockClient.query.withArgs(sinon.match(/SELECT u.nombre, d.department/), [studentId, testUser.orgId]).resolves({ rows: [mockStudentProfile.student_info] });
      mockClient.query.withArgs(sinon.match(/SELECT COUNT\(\*\) FILTER/), [studentId, testUser.orgId]).resolves({ rows: [mockStudentProfile.incidents_summary] });
      mockClient.query.withArgs(sinon.match(/SELECT COUNT\(\*\) as ausencias/), [studentId, testUser.orgId]).resolves({ rows: [mockStudentProfile.attendance_summary] });
      mockClient.query.withArgs(sinon.match(/SELECT comentario, fecha FROM observaciones/), [studentId, testUser.orgId]).resolves({ rows: mockStudentProfile.recent_observations });

      // Mock axios post call to external AI service
      sandbox.stub(axios, 'post').resolves({ data: mockAIResponse });

      const res = await request(app)
        .post('/api/ai/counselor/ask')
        .set('Authorization', `Bearer ${token}`)
        .send({ studentId, query });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.response).to.equal(mockAIResponse.response);
      expect(axios.post.calledOnceWith(
        'http://127.0.0.1:8000/generate-counselor-response',
        { student_data: mockStudentProfile, user_query: query }
      )).to.be.true;
    });

    it('should return 400 if studentId is missing', async () => {
      const res = await request(app)
        .post('/api/ai/counselor/ask')
        .set('Authorization', `Bearer ${token}`)
        .send({ query });

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Se requiere studentId y una consulta (query).');
    });

    it('should return 400 if query is missing', async () => {
      const res = await request(app)
        .post('/api/ai/counselor/ask')
        .set('Authorization', `Bearer ${token}`)
        .send({ studentId });

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Se requiere studentId y una consulta (query).');
    });

    it('should return 404 if student not found', async () => {
      mockClient.query.withArgs(sinon.match(/SELECT u.nombre, d.department/), [studentId, testUser.orgId]).resolves({ rows: [] });

      const res = await request(app)
        .post('/api/ai/counselor/ask')
        .set('Authorization', `Bearer ${token}`)
        .send({ studentId, query });

      expect(res.statusCode).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Estudiante no encontrado en esta organización.');
    });

    it('should return 500 if database error occurs during student profile fetching', async () => {
      mockClient.query.withArgs(sinon.match(/SELECT u.nombre, d.department/), [studentId, testUser.orgId]).throws(new Error('DB Error'));

      const res = await request(app)
        .post('/api/ai/counselor/ask')
        .set('Authorization', `Bearer ${token}`)
        .send({ studentId, query });

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No se pudo obtener una respuesta del Consejero AI.');
    });

    it('should return 500 if external AI service call fails', async () => {
      // Mock database queries for getStudentProfileForAI (success)
      mockClient.query.withArgs(sinon.match(/SELECT u.nombre, d.department/), [studentId, testUser.orgId]).resolves({ rows: [mockStudentProfile.student_info] });
      mockClient.query.withArgs(sinon.match(/SELECT COUNT\(\*\) FILTER/), [studentId, testUser.orgId]).resolves({ rows: [mockStudentProfile.incidents_summary] });
      mockClient.query.withArgs(sinon.match(/SELECT COUNT\(\*\) as ausencias/), [studentId, testUser.orgId]).resolves({ rows: [mockStudentProfile.attendance_summary] });
      mockClient.query.withArgs(sinon.match(/SELECT comentario, fecha FROM observaciones/), [studentId, testUser.orgId]).resolves({ rows: mockStudentProfile.recent_observations });

      // Mock axios post call to external AI service (failure)
      sandbox.stub(axios, 'post').throws(new Error('Network Error'));

      const res = await request(app)
        .post('/api/ai/counselor/ask')
        .set('Authorization', `Bearer ${token}`)
        .send({ studentId, query });

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No se pudo obtener una respuesta del Consejero AI.');
    });
  });
});