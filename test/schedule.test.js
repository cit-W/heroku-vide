import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from 'file:///C:/Users/jhoan/Documents/heroku-vide/config/db.js';
import jwt from 'jsonwebtoken';
import * as resolveNamesToIds from 'file:///C:/Users/jhoan/Documents/heroku-vide/models/resolveNamesToIds.js';
import { getMonthlyTopic, setMonthlyTopic } from 'file:///C:/Users/jhoan/Documents/heroku-vide/models/MonthlyTopic.js';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('Schedule Routes', () => {
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
    mockClient.query.withArgs("SELECT set_config('app.current_org_id', $1, false)", [testUser.orgId.toString()]).resolves();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('POST /schedule/create-event', () => {
    it('should create an event successfully', async () => {
      sandbox.stub(resolveNamesToIds, 'resolveNamesToIds').resolves({ place_id: 1 });
      mockClient.query.resolves({});

      const res = await request(app)
        .post('/schedule/create-event')
        .set('Authorization', `Bearer ${token}`)
        .query({ tema: 'Test Event', acargo: 'John Doe', fecha: '2025-01-01T10:00:00Z', descripcion: 'Description', lugar: 'Room 101' });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.equal('SUCCESS');
      expect(resolveNamesToIds.resolveNamesToIds.calledWith({
        organizacion_id: testUser.orgId,
        place: 'Room 101',
      })).to.be.true;
    });

    it('should return 500 if event creation fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .post('/schedule/create-event')
        .set('Authorization', `Bearer ${token}`)
        .query({ tema: 'Test Event', acargo: 'John Doe', fecha: '2025-01-01T10:00:00Z', descripcion: 'Description', lugar: 'Room 101' });

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('POST /schedule/delete-event', () => {
    it('should delete an event successfully', async () => {
      mockClient.query.resolves({});

      const res = await request(app)
        .post('/schedule/delete-event')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 1, organization_id: 101 });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.equal('success');
    });

    it('should return 400 if parameters are missing', async () => {
      const res = await request(app)
        .post('/schedule/delete-event')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 1 });

      expect(res.statusCode).to.equal(400);
    });

    it('should return 500 if event deletion fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .post('/schedule/delete-event')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 1, organization_id: 101 });

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('GET /schedule/month-events', () => {
    it('should return month events successfully', async () => {
      mockClient.query.resolves({ rows: [{ id: 1, tema: 'Event 1' }] });

      const res = await request(app)
        .get('/schedule/month-events')
        .set('Authorization', `Bearer ${token}`)
        .query({ month: 1, year: 2025, organization_id: 101 });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 400 if parameters are missing', async () => {
      const res = await request(app)
        .get('/schedule/month-events')
        .set('Authorization', `Bearer ${token}`)
        .query({ month: 1, year: 2025 });

      expect(res.statusCode).to.equal(400);
    });

    it('should return success false if no events are found', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app)
        .get('/schedule/month-events')
        .set('Authorization', `Bearer ${token}`)
        .query({ month: 1, year: 2025, organization_id: 101 });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('No_hay_eventos');
    });

    it('should return 500 if fetching month events fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .get('/schedule/month-events')
        .set('Authorization', `Bearer ${token}`)
        .query({ month: 1, year: 2025, organization_id: 101 });

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('GET /schedule/month-topic', () => {
    it('should return month topic successfully', async () => {
      sandbox.stub(MonthlyTopic, 'getMonthlyTopic').resolves({ topic: 'Test Monthly Topic' });

      const res = await request(app)
        .get('/schedule/month-topic')
        .set('Authorization', `Bearer ${token}`)
        .query({ month: 1, year: 2025 });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('topic', 'Test Monthly Topic');
    });

    it('should return 400 if parameters are missing', async () => {
      const res = await request(app)
        .get('/schedule/month-topic')
        .set('Authorization', `Bearer ${token}`)
        .query({ month: 1 });

      expect(res.statusCode).to.equal(400);
    });

    it('should return success false if no topic is found', async () => {
      sandbox.stub(MonthlyTopic, 'getMonthlyTopic').resolves(null);

      const res = await request(app)
        .get('/schedule/month-topic')
        .set('Authorization', `Bearer ${token}`)
        .query({ month: 1, year: 2025 });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('No se encontró un tema para el mes especificado.');
    });

    it('should return 500 if fetching month topic fails', async () => {
      sandbox.stub(MonthlyTopic, 'getMonthlyTopic').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/schedule/month-topic')
        .set('Authorization', `Bearer ${token}`)
        .query({ month: 1, year: 2025 });

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('POST /schedule/month-topic', () => {
    it('should set month topic successfully', async () => {
      sandbox.stub(MonthlyTopic, 'setMonthlyTopic').resolves({});

      const res = await request(app)
        .post('/schedule/month-topic')
        .set('Authorization', `Bearer ${token}`)
        .send({ month: 1, year: 2025, topic: 'New Monthly Topic' });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Tema del mes guardado exitosamente.');
    });

    it('should return 400 if parameters are missing', async () => {
      const res = await request(app)
        .post('/schedule/month-topic')
        .set('Authorization', `Bearer ${token}`)
        .send({ month: 1, year: 2025 });

      expect(res.statusCode).to.equal(400);
    });

    it('should return 500 if setting month topic fails', async () => {
      sandbox.stub(MonthlyTopic, 'setMonthlyTopic').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/schedule/month-topic')
        .set('Authorization', `Bearer ${token}`)
        .send({ month: 1, year: 2025, topic: 'New Monthly Topic' });

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('GET /schedule/week-events', () => {
    it('should return week events successfully', async () => {
      mockClient.query.resolves({ rows: [{ id: 1, tema: 'Event 1', lugar: 'Room A' }] });

      const res = await request(app)
        .get('/schedule/week-events')
        .set('Authorization', `Bearer ${token}`)
        .query({ organization_id: 101 });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 400 if organization_id is missing', async () => {
      const res = await request(app)
        .get('/schedule/week-events')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
    });

    it('should return success false if no events are found', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app)
        .get('/schedule/week-events')
        .set('Authorization', `Bearer ${token}`)
        .query({ organization_id: 101 });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('No_hay_eventos');
    });

    it('should return 500 if fetching week events fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .get('/schedule/week-events')
        .set('Authorization', `Bearer ${token}`)
        .query({ organization_id: 101 });

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('GET /schedule/next-events', () => {
    it('should return next events successfully', async () => {
      mockClient.query.resolves({ rows: [{ id: 1, tema: 'Event 1', lugar: 'Room A' }] });

      const res = await request(app)
        .get('/schedule/next-events')
        .set('Authorization', `Bearer ${token}`)
        .query({ organization_id: 101 });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 400 if organization_id is missing', async () => {
      const res = await request(app)
        .get('/schedule/next-events')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
    });

    it('should return success false if no events are found', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app)
        .get('/schedule/next-events')
        .set('Authorization', `Bearer ${token}`)
        .query({ organization_id: 101 });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('No_hay_eventos');
    });

    it('should return 500 if fetching next events fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .get('/schedule/next-events')
        .set('Authorization', `Bearer ${token}`)
        .query({ organization_id: 101 });

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('GET /schedule/closest-event', () => {
    it('should return closest event successfully', async () => {
      mockClient.query.resolves({ rows: [{ id: 1, tema: 'Closest Event', lugar: 'Room A' }] });

      const res = await request(app)
        .get('/schedule/closest-event')
        .set('Authorization', `Bearer ${token}`)
        .query({ organization_id: 101 });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('tema', 'Closest Event');
    });

    it('should return 400 if organization_id is missing', async () => {
      const res = await request(app)
        .get('/schedule/closest-event')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
    });

    it('should return success false if no closest event is found', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app)
        .get('/schedule/closest-event')
        .set('Authorization', `Bearer ${token}`)
        .query({ organization_id: 101 });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('No se encontró ningún evento futuro');
    });

    it('should return 500 if fetching closest event fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .get('/schedule/closest-event')
        .set('Authorization', `Bearer ${token}`)
        .query({ organization_id: 101 });

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('GET /schedule/event', () => {
    it('should return event successfully', async () => {
      mockClient.query.resolves({ rows: [{ id: 1, tema: 'Event Detail', lugar: 'Room A' }] });

      const res = await request(app)
        .get('/schedule/event')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 1, organization_id: 101 });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('tema', 'Event Detail');
    });

    it('should return 400 if parameters are missing', async () => {
      const res = await request(app)
        .get('/schedule/event')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 1 });

      expect(res.statusCode).to.equal(400);
    });

    it('should return success false if no event is found', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app)
        .get('/schedule/event')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 999, organization_id: 101 });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('No_hay_evento');
    });

    it('should return 500 if fetching event fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .get('/schedule/event')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 1, organization_id: 101 });

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('POST /schedule/mediagroup', () => {
    it('should update mediagroup successfully', async () => {
      mockClient.query.resolves({ rowCount: 1 });

      const res = await request(app)
        .post('/schedule/mediagroup')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 1, video: 'video_url', sonido: 'audio_url', organization_id: 101 });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.equal('success');
    });

    it('should return 400 if parameters are missing', async () => {
      const res = await request(app)
        .post('/schedule/mediagroup')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 1 });

      expect(res.statusCode).to.equal(400);
    });

    it('should return success false if no event is found for update', async () => {
      mockClient.query.resolves({ rowCount: 0 });

      const res = await request(app)
        .post('/schedule/mediagroup')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 999, video: 'video_url', sonido: 'audio_url', organization_id: 101 });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('No_se_encontró_evento_para_actualizar');
    });

    it('should return 500 if updating mediagroup fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .post('/schedule/mediagroup')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 1, video: 'video_url', sonido: 'audio_url', organization_id: 101 });

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('GET /schedule/list-mediagroup', () => {
    it('should return a list of mediagroup events successfully', async () => {
      mockClient.query.resolves({ rows: [{ id: 1, tema: 'Media Event 1', lugar: 'Room A' }] });

      const res = await request(app)
        .get('/schedule/list-mediagroup')
        .set('Authorization', `Bearer ${token}`)
        .query({ organization_id: 101 });

      expect(res.statusCode).to.equal(200);
      expect(res.body).to.be.an('array').that.is.not.empty;
    });

    it('should return 400 if organization_id is missing', async () => {
      const res = await request(app)
        .get('/schedule/list-mediagroup')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
    });

    it('should return success false if no mediagroup events are found', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app)
        .get('/schedule/list-mediagroup')
        .set('Authorization', `Bearer ${token}`)
        .query({ organization_id: 101 });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('No_hay_eventos');
    });

    it('should return 500 if fetching mediagroup events fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .get('/schedule/list-mediagroup')
        .set('Authorization', `Bearer ${token}`)
        .query({ organization_id: 101 });

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('Event Lifecycle', () => {
    it('should create, retrieve, and delete an event', async () => {
      const eventData = {
        tema: 'Lifecycle Test Event',
        acargo: 'Lifecycle Tester',
        fecha: '2025-07-13T10:00:00Z',
        descripcion: 'This is a lifecycle test.',
        lugar: 'Test Room',
      };

      // 1. Create the event
      sandbox.stub(resolveNamesToIds, 'resolveNamesToIds').resolves({ place_id: 1 });
      mockClient.query.resolves({ rows: [{ id: 999 }] }); // Mock the insert
      const createRes = await request(app)
        .post('/schedule/create-event')
        .set('Authorization', `Bearer ${token}`)
        .query(eventData);

      expect(createRes.statusCode).to.equal(200);
      expect(createRes.body.success).to.be.true;

      // 2. Retrieve the event to verify creation
      mockClient.query.resolves({ rows: [{ id: 999, ...eventData, lugar: 'Test Room' }] });
      const getRes = await request(app)
        .get('/schedule/event')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 999 });

      expect(getRes.statusCode).to.equal(200);
      expect(getRes.body.success).to.be.true;
      expect(getRes.body.data.tema).to.equal(eventData.tema);
      expect(getRes.body.data.lugar).to.equal(eventData.lugar);

      // 3. Delete the event
      mockClient.query.resolves({});
      const deleteRes = await request(app)
        .post('/schedule/delete-event')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 999 });

      expect(deleteRes.statusCode).to.equal(200);
      expect(deleteRes.body.success).to.be.true;

      // 4. Attempt to retrieve the deleted event
      mockClient.query.resolves({ rows: [] });
      const getDeletedRes = await request(app)
        .get('/schedule/event')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 999 });

      expect(getDeletedRes.statusCode).to.equal(200);
      expect(getDeletedRes.body.success).to.be.false;
    });
  });
});