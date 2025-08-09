import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from 'file:///C:/Users/jhoan/Documents/heroku-vide/config/db.js';
import jwt from 'jsonwebtoken';
import * as UserDevices from '../models/UserDevices.js';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('User Device Routes', () => {
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

  describe('POST /user-devices', () => {
    const deviceData = {
      user_id: 1,
      player_id: 'player123',
      device_type: 'mobile',
    };

    it('should create a user device successfully', async () => {
      sandbox.stub(UserDevices, 'postDevice').resolves({ id: 1 });

      const res = await request(app)
        .post('/user-devices')
        .set('Authorization', `Bearer ${token}`)
        .send(deviceData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal({ id: 1 });
      expect(UserDevices.postDevice.calledOnceWith(
        { ...deviceData, organizacion_id: testUser.orgId },
        mockClient
      )).to.be.true;
    });

    it('should return 400 if user_id or player_id is missing', async () => {
      const { user_id, ...dataWithout } = deviceData;
      const res = await request(app)
        .post('/user-devices')
        .set('Authorization', `Bearer ${token}`)
        .send(dataWithout);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Faltan user_id o player_id.');
    });

    it('should return 500 if postDevice fails', async () => {
      sandbox.stub(UserDevices, 'postDevice').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/user-devices')
        .set('Authorization', `Bearer ${token}`)
        .send(deviceData);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /user-devices', () => {
    const userId = 1;
    const mockDevices = [{ id: 1, player_id: 'player123' }];

    it('should return user devices successfully', async () => {
      sandbox.stub(UserDevices, 'getDevice').resolves(mockDevices);

      const res = await request(app)
        .get(`/user-devices?user_id=${userId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockDevices);
      expect(UserDevices.getDevice.calledOnceWith(userId, testUser.orgId, mockClient)).to.be.true;
    });

    it('should return 500 if getDevice fails', async () => {
      sandbox.stub(UserDevices, 'getDevice').throws(new Error('DB Error'));

      const res = await request(app)
        .get(`/user-devices?user_id=${userId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('PUT /user-devices/:id', () => {
    const deviceId = 1;
    const updateData = {
      is_active: false,
    };
    const mockUpdatedDevice = { id: deviceId, is_active: false };

    it('should update a user device successfully', async () => {
      sandbox.stub(UserDevices, 'updateDevice').resolves(mockUpdatedDevice);

      const res = await request(app)
        .put(`/user-devices/${deviceId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockUpdatedDevice);
      expect(UserDevices.updateDevice.calledOnceWith(
        deviceId, { ...updateData, organizacion_id: testUser.orgId }, mockClient
      )).to.be.true;
    });

    it('should return 404 if device not found', async () => {
      sandbox.stub(UserDevices, 'updateDevice').resolves(null);

      const res = await request(app)
        .put(`/user-devices/999`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.statusCode).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Dispositivo no encontrado.');
    });

    it('should return 500 if updateDevice fails', async () => {
      sandbox.stub(UserDevices, 'updateDevice').throws(new Error('DB Error'));

      const res = await request(app)
        .put(`/user-devices/${deviceId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('DELETE /user-devices/:id', () => {
    const deviceId = 1;

    it('should delete a user device successfully', async () => {
      sandbox.stub(UserDevices, 'deleteDevice').resolves(true);

      const res = await request(app)
        .delete(`/user-devices/${deviceId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Dispositivo eliminado correctamente.');
      expect(UserDevices.deleteDevice.calledOnceWith(deviceId, testUser.orgId, mockClient)).to.be.true;
    });

    it('should return 404 if device not found', async () => {
      sandbox.stub(UserDevices, 'deleteDevice').resolves(false);

      const res = await request(app)
        .delete(`/user-devices/999`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Dispositivo no encontrado.');
    });

    it('should return 500 if deleteDevice fails', async () => {
      sandbox.stub(UserDevices, 'deleteDevice').throws(new Error('DB Error'));

      const res = await request(app)
        .delete(`/user-devices/${deviceId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });
});