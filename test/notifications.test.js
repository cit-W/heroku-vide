import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import jwt from 'jsonwebtoken';
import * as OneSignal from '@onesignal/node-onesignal';
import * as Notification from '../models/Notification.js';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';
const ONESIGNAL_APP_ID = 'test_app_id';

describe('Notification Routes', () => {
  let sandbox;
  let token;
  const testUser = { userId: 1, orgId: 'org_cwn_test' };
  let createNotificationStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    token = jwt.sign(testUser, SECRET_KEY, { expiresIn: '1h' });

    // Mock OneSignal client
    createNotificationStub = sandbox.stub().resolves({ id: 'mock_notification_id' });
    sandbox.stub(OneSignal, 'DefaultApi').returns({
      createNotification: createNotificationStub,
    });
    sandbox.stub(OneSignal, 'createConfiguration').returns({});
    process.env.ONESIGNAL_APP_ID = ONESIGNAL_APP_ID; // Ensure APP_ID is set for the test
  });

  afterEach(() => {
    sandbox.restore();
    delete process.env.ONESIGNAL_APP_ID;
  });

  describe('POST /send', () => {
    const notificationData = {
      onesignalId: 'player123',
      title: 'Test Title',
      body: 'Test Body',
    };

    it('should send a notification successfully', async () => {
      const res = await request(app)
        .post('/notifications/send')
        .send(notificationData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.notificationId).to.equal('mock_notification_id');
      expect(createNotificationStub.calledOnce).to.be.true;
      const notificationArg = createNotificationStub.firstCall.args[0];
      expect(notificationArg.app_id).to.equal(ONESIGNAL_APP_ID);
      expect(notificationArg.include_player_ids).to.deep.equal([notificationData.onesignalId]);
      expect(notificationArg.headings).to.deep.equal({ en: notificationData.title });
      expect(notificationArg.contents).to.deep.equal({ en: notificationData.body });
    });

    it('should return 400 if onesignalId is missing', async () => {
      const { onesignalId, ...dataWithout } = notificationData;
      const res = await request(app)
        .post('/notifications/send')
        .send(dataWithout);

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('onesignalId, title y body son requeridos');
    });

    it('should return 500 if OneSignal API call fails', async () => {
      createNotificationStub.throws(new Error('OneSignal Error'));

      const res = await request(app)
        .post('/notifications/send')
        .send(notificationData);

      expect(res.statusCode).to.equal(500);
      expect(res.body.error).to.equal('Error al enviar la notificación');
    });
  });

  describe('POST /register-user', () => {
    const userData = {
      player_id: 'player456',
      user_id: 1,
      role: 'student',
      organizacion_id: 'org_cwn_test',
    };

    it('should register user successfully', async () => {
      sandbox.stub(Notification, 'registerUser').resolves({});

      const res = await request(app)
        .post('/notifications/register-user')
        .send(userData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Usuario registrado y tag asignado.');
      expect(Notification.registerUser.calledOnceWith(
        userData.user_id, userData.player_id, userData.role, userData.organizacion_id
      )).to.be.true;
    });

    it('should return 400 if player_id is missing', async () => {
      const { player_id, ...dataWithout } = userData;
      const res = await request(app)
        .post('/notifications/register-user')
        .send(dataWithout);

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('Faltan datos (player_id, user_id, role)');
    });
  });

  describe('POST /send-to-player', () => {
    const sendData = {
      title: 'Player Notif',
      body: 'Message for player',
      playerId: 'player789',
    };

    it('should send notification to player successfully', async () => {
      sandbox.stub(Notification, 'sendNotificationToPlayer').resolves({});

      const res = await request(app)
        .post('/notifications/send-to-player')
        .send(sendData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(Notification.sendNotificationToPlayer.calledOnceWith(
        sendData.title, sendData.body, sendData.playerId
      )).to.be.true;
    });

    it('should return 400 if title is missing', async () => {
      const { title, ...dataWithout } = sendData;
      const res = await request(app)
        .post('/notifications/send-to-player')
        .send(dataWithout);

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('Faltan datos (title, body, playerId)');
    });
  });

  describe('GET /history', () => {
    const mockNotifications = [{ id: 1, message: 'Notif 1' }];

    it('should return notifications for user successfully', async () => {
      sandbox.stub(Notification, 'getNotificationsForUser').resolves(mockNotifications);

      const res = await request(app)
        .get('/notifications/history')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockNotifications);
      expect(Notification.getNotificationsForUser.calledOnceWith(testUser.userId)).to.be.true;
    });
  });

  describe('POST /send-by-roles', () => {
    const sendData = {
      title: 'Role Notif',
      body: 'Message for roles',
      roles: ['admin', 'teacher'],
    };

    it('should send notification by roles successfully', async () => {
      sandbox.stub(Notification, 'sendNotificationByRoles').resolves({});

      const res = await request(app)
        .post('/notifications/send-by-roles')
        .set('Authorization', `Bearer ${token}`)
        .send(sendData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(Notification.sendNotificationByRoles.calledOnceWith(
        sendData.title, sendData.body, sendData.roles, testUser.orgId
      )).to.be.true;
    });

    it('should return 400 if title is missing', async () => {
      const { title, ...dataWithout } = sendData;
      const res = await request(app)
        .post('/notifications/send-by-roles')
        .set('Authorization', `Bearer ${token}`)
        .send(dataWithout);

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('Faltan datos (title, body, roles[array])');
    });
  });

  describe('POST /send-to-org', () => {
    const sendData = {
      title: 'Org Notif',
      body: 'Message for organization',
    };

    it('should send notification to organization successfully', async () => {
      sandbox.stub(Notification, 'sendNotificationToOrg').resolves({});

      const res = await request(app)
        .post('/notifications/send-to-org')
        .set('Authorization', `Bearer ${token}`)
        .send(sendData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(Notification.sendNotificationToOrg.calledOnceWith(
        sendData.title, sendData.body, testUser.orgId
      )).to.be.true;
    });

    it('should return 400 if title is missing', async () => {
      const { title, ...dataWithout } = sendData;
      const res = await request(app)
        .post('/notifications/send-to-org')
        .set('Authorization', `Bearer ${token}`)
        .send(dataWithout);

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('Faltan datos (title, body)');
    });
  });
});