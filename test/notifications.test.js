import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';


describe('Notifications Routes', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('POST /notifications/register-user', () => {
    it('should register user successfully', async () => {
      sandbox.stub(Notification, 'registerUser').resolves({});

      const res = await request(app)
        .post('/notifications/register-user')
        .send({ player_id: 'player123', user_id: 'user1', role: 'student' });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Usuario registrado y tag asignado correctamente.');
    });

    it('should return 400 if required data is missing', async () => {
      const res = await request(app)
        .post('/notifications/register-user')
        .send({ player_id: 'player123' }); 

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('Faltan datos (player_id, user_id, role)');
    });

    it('should return 500 if user registration fails', async () => {
      sandbox.stub(Notification, 'registerUser').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/notifications/register-user')
        .send({ player_id: 'player123', user_id: 'user1', role: 'student' });

      expect(res.statusCode).to.equal(500);
      expect(res.body.error).to.equal('Error al registrar el usuario.');
    });
  });

  describe('POST /notifications/send-notification', () => {
    it('should send notification successfully', async () => {
      sandbox.stub(Notification, 'sendNotification').resolves({ data: { id: 'notif123' } });

      const res = await request(app)
        .post('/notifications/send-notification')
        .send({ title: 'Test Title', body: 'Test Body', role: 'student' });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Notificación enviada correctamente');
      expect(res.body.data).to.have.property('id', 'notif123');
    });

    it('should return 400 if required data is missing', async () => {
      const res = await request(app)
        .post('/notifications/send-notification')
        .send({ title: 'Test Title' }); 

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('Faltan datos (title, body)');
    });

    it('should return 500 if sending notification fails', async () => {
      sandbox.stub(Notification, 'sendNotification').throws(new Error('API Error'));

      const res = await request(app)
        .post('/notifications/send-notification')
        .send({ title: 'Test Title', body: 'Test Body', role: 'student' });

      expect(res.statusCode).to.equal(500);
      expect(res.body.error).to.equal('Error al enviar la notificación.');
    });
  });
});
