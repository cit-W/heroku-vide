import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from '../config/db.js';
import * as TrabajoSocial from 'file:///C:/Users/jhoan/Documents/heroku-vide/models/TrabajoSocial.js';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('Social Work Routes', () => {
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

  describe('POST /social-work/add-social-work', () => {
    it('should add social work successfully', async () => {
      sandbox.stub(TrabajoSocial, 'addSocialWork').resolves({});

      const res = await request(app)
        .post('/social-work/add-social-work')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Work', description: 'Description', hours: '10', date: '2025-01-01' });

      expect(res.statusCode).to.equal(200);
      expect(res.body.message).to.equal('Trabajo social registrado');
    });

    it('should return 400 if data is missing', async () => {
      const res = await request(app)
        .post('/social-work/add-social-work')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Work' }); 

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('Faltan datos');
    });

    it('should return 500 if adding social work fails', async () => {
      sandbox.stub(TrabajoSocial, 'addSocialWork').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/social-work/add-social-work')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Work', description: 'Description', hours: '10', date: '2025-01-01' });

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('GET /social-work/get-ids', () => {
    it('should return a list of social work IDs', async () => {
      sandbox.stub(TrabajoSocial, 'getIDs').resolves([{ id: 1 }]);

      const res = await request(app)
        .get('/social-work/get-ids')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 500 if fetching social work IDs fails', async () => {
      sandbox.stub(TrabajoSocial, 'getIDs').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/social-work/get-ids')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('GET /social-work/get-social-work-record', () => {
    it('should return social work record if ID is valid', async () => {
      sandbox.stub(TrabajoSocial, 'getByID').resolves({ id: 1, name: 'Test Work' });

      const res = await request(app)
        .get('/social-work/get-social-work-record?id=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('id', 1);
    });

    it('should return 400 if no ID is provided', async () => {
      const res = await request(app)
        .get('/social-work/get-social-work-record')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('ID es requerido');
    });

    it('should return 404 if record not found', async () => {
      sandbox.stub(TrabajoSocial, 'getByID').resolves(null);

      const res = await request(app)
        .get('/social-work/get-social-work-record?id=999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Registro no encontrado');
    });

    it('should return 500 if fetching social work record fails', async () => {
      mockClient.query.withArgs(sinon.match.string, sinon.match.array).throws(new Error('DB Error'));

      const res = await request(app)
        .get('/social-work/get-social-work-record?id=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
    });
  });
});
