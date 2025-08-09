import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from 'file:///C:/Users/jhoan/Documents/heroku-vide/config/db.js';
import jwt from 'jsonwebtoken';
import * as TrabajoSocial from '../models/TrabajoSocial.js';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('Social Work Routes', () => {
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

  describe('POST /social-work/add-social-work', () => {
    const socialWorkData = {
      description: 'Limpieza de áreas verdes',
      hours: 4,
      date: '2025-07-28',
    };

    it('should add social work successfully', async () => {
      sandbox.stub(TrabajoSocial, 'addSocialWork').resolves({});

      const res = await request(app)
        .post('/social-work/add-social-work')
        .set('Authorization', `Bearer ${token}`)
        .send(socialWorkData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.message).to.equal('Trabajo social registrado');
      expect(TrabajoSocial.addSocialWork.calledOnceWith(
        testUser.userId, socialWorkData.description, socialWorkData.hours, socialWorkData.date, testUser.orgId, mockClient
      )).to.be.true;
    });

    it('should return 400 if data is missing', async () => {
      const { description, ...dataWithout } = socialWorkData;
      const res = await request(app)
        .post('/social-work/add-social-work')
        .set('Authorization', `Bearer ${token}`)
        .send(dataWithout);

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('Faltan datos');
    });

    it('should return 500 if addSocialWork fails', async () => {
      sandbox.stub(TrabajoSocial, 'addSocialWork').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/social-work/add-social-work')
        .set('Authorization', `Bearer ${token}`)
        .send(socialWorkData);

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('GET /social-work/get-social-works', () => {
    const mockSocialWorks = [{ id: 1, description: 'Work 1' }, { id: 2, description: 'Work 2' }];

    it('should return all social works successfully', async () => {
      sandbox.stub(TrabajoSocial, 'getSocialWorks').resolves(mockSocialWorks);

      const res = await request(app)
        .get('/social-work/get-social-works')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockSocialWorks);
      expect(TrabajoSocial.getSocialWorks.calledOnceWith(testUser.orgId, mockClient)).to.be.true;
    });

    it('should return 500 if getSocialWorks fails', async () => {
      sandbox.stub(TrabajoSocial, 'getSocialWorks').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/social-work/get-social-works')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('GET /social-work/get-social-work-record', () => {
    const socialWorkId = 123;
    const mockSocialWork = { id: socialWorkId, description: 'Test Work' };

    it('should return social work record by ID successfully', async () => {
      sandbox.stub(TrabajoSocial, 'getByID').resolves(mockSocialWork);

      const res = await request(app)
        .get(`/social-work/get-social-work-record?id=${socialWorkId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockSocialWork);
      expect(TrabajoSocial.getByID.calledOnceWith(socialWorkId, testUser.orgId, mockClient)).to.be.true;
    });

    it('should return 404 if record not found', async () => {
      sandbox.stub(TrabajoSocial, 'getByID').resolves(null);

      const res = await request(app)
        .get(`/social-work/get-social-work-record?id=999`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Registro no encontrado');
    });

    it('should return 400 if id is missing', async () => {
      const res = await request(app)
        .get(`/social-work/get-social-work-record`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('ID es requerido');
    });

    it('should return 500 if getByID fails', async () => {
      sandbox.stub(TrabajoSocial, 'getByID').throws(new Error('DB Error'));

      const res = await request(app)
        .get(`/social-work/get-social-work-record?id=${socialWorkId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
    });
  });
});