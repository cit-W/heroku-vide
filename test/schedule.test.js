import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from 'file:///C:/Users/jhoan/Documents/heroku-vide/config/db.js';
import jwt from 'jsonwebtoken';
import * as resolveNamesToIdsModule from '../models/resolveNamesToIds.js';
import * as MonthlyTopic from '../models/MonthlyTopic.js';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('Schedule Routes', () => {
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

    // Mock Date for consistent week calculations
    const fixedDate = new Date('2025-07-28T10:00:00Z'); // A Monday in July
    sandbox.stub(global, 'Date').returns(fixedDate);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('POST /schedule/create-event', () => {
    const eventData = {
      tema: 'Reunión de Equipo',
      acargo: 'Juan Pérez',
      mediagroup_video: 'video123',
      mediagroup_sonido: 'sonido456',
      fecha: '2025-07-29T14:00:00Z',
      descripcion: 'Discusión de proyectos',
      lugar: 'Sala de Juntas',
    };

    it('should create an event successfully', async () => {
      sandbox.stub(resolveNamesToIdsModule, 'resolveNamesToIds').resolves({ place_id: 1 });
      mockClient.query.resolves({});

      const res = await request(app)
        .post('/schedule/create-event')
        .set('Authorization', `Bearer ${token}`)
        .send(eventData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.equal('SUCCESS');
      expect(resolveNamesToIdsModule.resolveNamesToIds.calledOnceWith({
        organizacion_id: testUser.orgId,
        place: eventData.lugar,
      })).to.be.true;
      expect(mockClient.query.calledOnce).to.be.true;
    });

    it('should return 500 if resolveNamesToIds fails', async () => {
      sandbox.stub(resolveNamesToIdsModule, 'resolveNamesToIds').throws(new Error('Place not found'));

      const res = await request(app)
        .post('/schedule/create-event')
        .set('Authorization', `Bearer ${token}`)
        .send(eventData);

      expect(res.statusCode).to.equal(500);
      expect(res.text).to.include('Error al crear evento');
    });

    it('should return 500 if database insert fails', async () => {
      sandbox.stub(resolveNamesToIdsModule, 'resolveNamesToIds').resolves({ place_id: 1 });
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .post('/schedule/create-event')
        .set('Authorization', `Bearer ${token}`)
        .send(eventData);

      expect(res.statusCode).to.equal(500);
      expect(res.text).to.include('Error al crear evento');
    });
  });

  describe('POST /schedule/delete-event', () => {
    it('should delete an event successfully', async () => {
      mockClient.query.resolves({ rowCount: 1 });

      const res = await request(app)
        .post('/schedule/delete-event?id=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.equal('success');
      expect(mockClient.query.calledOnceWith(
        sinon.match(/DELETE FROM events/),
        ['1', testUser.orgId]
      )).to.be.true;
    });

    it('should return 400 if id is missing', async () => {
      const res = await request(app)
        .post('/schedule/delete-event')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
      expect(res.text).to.include("El parámetro 'id' es requerido.");
    });

    it('should return 500 if database delete fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .post('/schedule/delete-event?id=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.text).to.include('Error al consultar la tabla');
    });
  });

  describe('GET /schedule/month-events', () => {
    const mockEvents = [{ id: 1, tema: 'Event 1' }, { id: 2, tema: 'Event 2' }];

    it('should return events for a given month and year', async () => {
      mockClient.query.resolves({ rows: mockEvents });

      const res = await request(app)
        .get('/schedule/month-events?month=7&year=2025')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockEvents);
      expect(mockClient.query.calledOnceWith(
        sinon.match(/SELECT \* FROM mview_events_details/),
        ['7', '2025', testUser.orgId]
      )).to.be.true;
    });

    it('should return no_hay_eventos if no events found', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app)
        .get('/schedule/month-events?month=1&year=2020')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('No_hay_eventos');
    });

    it('should return 400 if month or year is missing', async () => {
      const res = await request(app)
        .get('/schedule/month-events?month=7')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
      expect(res.text).to.include("Los parámetros 'month', 'year' y 'organization_id' son requeridos.");
    });

    it('should return 500 if database query fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .get('/schedule/month-events?month=7&year=2025')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.text).to.include('Error al consultar la tabla');
    });
  });

  describe('GET /schedule/month-topic', () => {
    it('should return monthly topic successfully', async () => {
      sandbox.stub(MonthlyTopic, 'getMonthlyTopic').resolves('Test Topic');

      const res = await request(app)
        .get('/schedule/month-topic?month=7&year=2025')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.equal('Test Topic');
      expect(MonthlyTopic.getMonthlyTopic.calledOnceWith(testUser.orgId, 2025, 7, mockClient)).to.be.true;
    });

    it('should return no topic found message', async () => {
      sandbox.stub(MonthlyTopic, 'getMonthlyTopic').resolves(null);

      const res = await request(app)
        .get('/schedule/month-topic?month=1&year=2020')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('No se encontró un tema para el mes especificado.');
    });

    it('should return 400 if month or year is missing', async () => {
      const res = await request(app)
        .get('/schedule/month-topic?month=7')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
      expect(res.text).to.include("Los parámetros 'month' y 'year' son requeridos.");
    });

    it('should return 500 if getMonthlyTopic fails', async () => {
      sandbox.stub(MonthlyTopic, 'getMonthlyTopic').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/schedule/month-topic?month=7&year=2025')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.text).to.include('Error al consultar el tema del mes');
    });
  });

  describe('POST /schedule/month-topic', () => {
    const topicData = {
      month: 7,
      year: 2025,
      topic: 'Nuevo Tema del Mes',
    };

    it('should set monthly topic successfully', async () => {
      sandbox.stub(MonthlyTopic, 'setMonthlyTopic').resolves(true);

      const res = await request(app)
        .post('/schedule/month-topic')
        .set('Authorization', `Bearer ${token}`)
        .send(topicData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Tema del mes guardado exitosamente.');
      expect(MonthlyTopic.setMonthlyTopic.calledOnceWith(
        testUser.orgId, topicData.year, topicData.month, topicData.topic, mockClient
      )).to.be.true;
    });

    it('should return 400 if month, year or topic is missing', async () => {
      const { topic, ...dataWithout } = topicData;
      const res = await request(app)
        .post('/schedule/month-topic')
        .set('Authorization', `Bearer ${token}`)
        .send(dataWithout);

      expect(res.statusCode).to.equal(400);
      expect(res.text).to.include("Los parámetros 'month', 'year' y 'topic' son requeridos.");
    });

    it('should return 500 if setMonthlyTopic fails', async () => {
      sandbox.stub(MonthlyTopic, 'setMonthlyTopic').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/schedule/month-topic')
        .set('Authorization', `Bearer ${token}`)
        .send(topicData);

      expect(res.statusCode).to.equal(500);
      expect(res.text).to.include('Error al guardar el tema del mes');
    });
  });

  describe('GET /schedule/week-events', () => {
    const mockEvents = [{ id: 1, tema: 'Weekly Event' }];

    it('should return events for the current week', async () => {
      mockClient.query.resolves({ rows: mockEvents });

      const res = await request(app)
        .get('/schedule/week-events')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockEvents);
      // Verify query with calculated week number (2025-07-28 is week 31)
      expect(mockClient.query.calledOnceWith(
        sinon.match(/SELECT \* FROM mview_events_details/),
        [31, testUser.orgId]
      )).to.be.true;
    });

    it('should return no_hay_eventos if no events found', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app)
        .get('/schedule/week-events')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('No_hay_eventos');
    });

    it('should return 500 if database query fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .get('/schedule/week-events')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.text).to.include('Error al consultar la tabla');
    });
  });

  describe('GET /schedule/next-events', () => {
    const mockEvents = [{ id: 1, tema: 'Next Event' }];

    it('should return events for the current week (same as week-events)', async () => {
      mockClient.query.resolves({ rows: mockEvents });

      const res = await request(app)
        .get('/schedule/next-events')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockEvents);
      // Verify query with calculated week number (2025-07-28 is week 31)
      expect(mockClient.query.calledOnceWith(
        sinon.match(/SELECT \* FROM mview_events_details/),
        [31, testUser.orgId]
      )).to.be.true;
    });

    it('should return no_hay_eventos if no events found', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app)
        .get('/schedule/next-events')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('No_hay_eventos');
    });

    it('should return 500 if database query fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .get('/schedule/next-events')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.text).to.include('Error al consultar la tabla');
    });
  });

  describe('GET /schedule/closest-event', () => {
    const mockEvent = { id: 1, tema: 'Closest Event', fecha: '2025-07-29T10:00:00Z' };

    it('should return the closest future event', async () => {
      mockClient.query.resolves({ rows: [mockEvent] });

      const res = await request(app)
        .get('/schedule/closest-event')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockEvent);
      expect(mockClient.query.calledOnceWith(
        sinon.match(/SELECT \* FROM mview_events_details WHERE fecha >= NOW\(\) AND organization_id = \$1 ORDER BY fecha ASC LIMIT 1/),
        [testUser.orgId]
      )).to.be.true;
    });

    it('should return no future event found message', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app)
        .get('/schedule/closest-event')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('No se encontró ningún evento futuro');
    });

    it('should return 500 if database query fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .get('/schedule/closest-event')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.text).to.include('Error al obtener el evento');
    });
  });

  describe('GET /schedule/event', () => {
    const mockEvent = { id: 1, tema: 'Single Event' };

    it('should return a single event by ID', async () => {
      mockClient.query.resolves({ rows: [mockEvent] });

      const res = await request(app)
        .get('/schedule/event?id=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockEvent);
      expect(mockClient.query.calledOnceWith(
        sinon.match(/SELECT \* FROM mview_events_details WHERE id = \$1 AND organization_id = \$2/),
        ['1', testUser.orgId]
      )).to.be.true;
    });

    it('should return no_hay_evento if event not found', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app)
        .get('/schedule/event?id=999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('No_hay_evento');
    });

    it('should return 400 if id is missing', async () => {
      const res = await request(app)
        .get('/schedule/event')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
      expect(res.text).to.include("Los parámetros 'id' y 'organization_id' son requeridos.");
    });

    it('should return 500 if database query fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .get('/schedule/event?id=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.text).to.include('Error al consultar el evento');
    });
  });

  describe('POST /schedule/mediagroup', () => {
    const mediagroupData = {
      id: 1,
      video: 'new_video_id',
      sonido: 'new_audio_id',
    };

    it('should update mediagroup successfully', async () => {
      mockClient.query.resolves({ rowCount: 1 });

      const res = await request(app)
        .post('/schedule/mediagroup?id=1&video=new_video_id&sonido=new_audio_id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.equal('success');
      expect(mockClient.query.calledOnceWith(
        sinon.match(/UPDATE events SET mediagroup_video = \$1, mediagroup_sonido = \$2 WHERE id = \$3 AND organization_id = \$4/),
        [mediagroupData.video, mediagroupData.sonido, mediagroupData.id, testUser.orgId]
      )).to.be.true;
    });

    it('should return no_se_encontró_evento_para_actualizar if event not found', async () => {
      mockClient.query.resolves({ rowCount: 0 });

      const res = await request(app)
        .post('/schedule/mediagroup?id=999&video=new_video_id&sonido=new_audio_id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('No_se_encontró_evento_para_actualizar');
    });

    it('should return 400 if id or organization_id is missing', async () => {
      const res = await request(app)
        .post('/schedule/mediagroup?video=new_video_id&sonido=new_audio_id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
      expect(res.text).to.include("Los parámetros 'id' y 'organization_id' son requeridos.");
    });

    it('should return 500 if database update fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .post('/schedule/mediagroup?id=1&video=new_video_id&sonido=new_audio_id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.text).to.include('Error al actualizar mediagroup');
    });
  });

  describe('GET /schedule/list-mediagroup', () => {
    const mockEvents = [{ id: 1, tema: 'Media Event 1' }, { id: 2, tema: 'Media Event 2' }];

    it('should return mediagroup events successfully', async () => {
      mockClient.query.resolves({ rows: mockEvents });

      const res = await request(app)
        .get('/schedule/list-mediagroup')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body).to.deep.equal(mockEvents);
      // Verify query with calculated week numbers (2025-07-28 is week 31)
      expect(mockClient.query.calledOnceWith(
        sinon.match(/SELECT \* FROM mview_events_details WHERE organization_id = \$1 AND n_semana IN \(\$2, \$3, \$4, \$5\)/),
        [testUser.orgId, 31, 32, 33, 34]
      )).to.be.true;
    });

    it('should return no_hay_eventos if no events found', async () => {
      mockClient.query.resolves({ rows: [] });

      const res = await request(app)
        .get('/schedule/list-mediagroup')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('No_hay_eventos');
    });

    it('should return 400 if organization_id is missing (though handled by middleware)', async () => {
      // Remove token to simulate missing orgId
      const res = await request(app)
        .get('/schedule/list-mediagroup');

      expect(res.statusCode).to.equal(401); // Expecting auth middleware to catch this
    });

    it('should return 500 if database query fails', async () => {
      mockClient.query.throws(new Error('DB Error'));

      const res = await request(app)
        .get('/schedule/list-mediagroup')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.error).to.include('Error al consultar los eventos de mediagroup');
    });
  });
});