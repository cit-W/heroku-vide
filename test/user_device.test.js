import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from '../config/db.js';
import * as UserDevices from 'file:///C:/Users/jhoan/Documents/heroku-vide/models/UserDevices.js';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('User Device Routes', () => {
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
    mockClient.query
      .withArgs("SELECT set_config('app.current_org_id', $1, false)", [
        testUser.orgId.toString(),
      ])
      .resolves();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('POST /user-devices', () => {
    it('should create a device successfully', async () => {
      sandbox
        .stub(UserDevices, 'postDevice')
        .resolves({ id: 1, user_id: 1, player_id: 'player123' });

      const res = await request(app)
        .post('/user-devices')
        .set('Authorization', `Bearer ${token}`)
        .send({ user_id: 1, player_id: 'player123', device_type: 'mobile' });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('user_id', 1);
    });

    it('should return 400 if required data is missing', async () => {
      const res = await request(app)
        .post('/user-devices')
        .set('Authorization', `Bearer ${token}`)
        .send({ user_id: 1 });

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Faltan user_id o player_id.');
    });
  });

  describe('GET /user-devices', () => {
    it('should return device info successfully', async () => {
      sandbox
        .stub(UserDevices, 'getDevice')
        .resolves([{ id: 1, user_id: 1, player_id: 'player123' }]);

      const res = await request(app)
        .get('/user-devices?user_id=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data[0]).to.have.property('user_id', 1);
    });
  });

  describe('PUT /user-devices/:id', () => {
    it('should update a device successfully', async () => {
      sandbox
        .stub(UserDevices, 'updateDevice')
        .resolves({ id: 1, device_type: 'tablet' });

      const res = await request(app)
        .put('/user-devices/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ device_type: 'tablet' });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('device_type', 'tablet');
    });

    it('should return 404 if device not found', async () => {
      sandbox.stub(UserDevices, 'updateDevice').resolves(null);

      const res = await request(app)
        .put('/user-devices/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ device_type: 'tablet' });

      expect(res.statusCode).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Dispositivo no encontrado.');
    });
  });

  describe('DELETE /user-devices/:id', () => {
    it('should delete a device successfully', async () => {
      sandbox.stub(UserDevices, 'deleteDevice').resolves(true);

      const res = await request(app)
        .delete('/user-devices/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal(
        'Dispositivo eliminado correctamente.'
      );
    });

    it('should return 404 if device not found', async () => {
      sandbox.stub(UserDevices, 'deleteDevice').resolves(false);

      const res = await request(app)
        .delete('/user-devices/999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Dispositivo no encontrado.');
    });
  });
});
