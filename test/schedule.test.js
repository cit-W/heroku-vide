import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from 'file:///C:/Users/jhoan/Documents/heroku-vide/config/db.js';
import jwt from 'jsonwebtoken';

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
      mockClient.query.resolves({});

      const res = await request(app)
        .post('/schedule/create-event')
        .set('Authorization', `Bearer ${token}`)
        .query({ tema: 'Test Event', acargo: 'John Doe', fecha: '2025-01-01T10:00:00Z', descripcion: 'Description', lugar: 'Room 101' });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.equal('SUCCESS');
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
      mockClient.query.resolves({ rows: [{ tema: 'Test Topic' }] });

      const res = await request(app)
        .get('/schedule/month-topic')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 1, organization_id: 101 });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('tema', 'Test Topic');
    });

    it('should return 400 if parameters are missing', async () => {
      const res = await request(app)
        .get('/schedule/month-topic')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 1 });

      expect(res.statusCode).to.equal(400);
    });

    it('should return success false if no topic is found', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app)
        .get('/schedule/month-topic')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 999, organization_id: 101 });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('No_hay_evento');
    });

    it('should return 500 if fetching month topic fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .get('/schedule/month-topic')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 1, organization_id: 101 });

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('GET /schedule/week-events', () => {
    it('should return week events successfully', async () => {
      mockClient.query.resolves({ rows: [{ id: 1, tema: 'Event 1' }] });

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
      mockClient.query.resolves({ rows: [{ id: 1, tema: 'Event 1' }] });

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
      mockClient.query.resolves({ rows: [{ id: 1, tema: 'Closest Event' }] });

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
      mockClient.query.resolves({ rows: [{ id: 1, tema: 'Event Detail' }] });

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
      mockClient.query.resolves({ rows: [{ id: 1, tema: 'Media Event 1' }] });

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
});
