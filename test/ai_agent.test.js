import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from 'file:///C:/Users/jhoan/Documents/heroku-vide/config/db.js';
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Importar los modelos y funciones que el agente de IA puede usar
import Reservation from '../models/Reserva.js';
import * as TrabajoSocial from '../models/TrabajoSocial.js';
import * as Espacio from '../models/Espacio.js';
import * as Departamento from '../models/Departamento.js';
import * as Cronograma from '../models/Cronograma.js';
import * as Asistencia from '../models/Asistencia.js';
import * as Student from '../models/Student.js';
import * as Notification from '../models/Notification.js';
import * as Citacion from '../models/Citacion.js';
import * as Rastrear from '../models/Rastrear.js';
import * as AIMemory from '../models/AIMemory.js';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('AI Agent Routes', () => {
  let sandbox;
  let mockClient;
  let token;
  const testUser = { userId: 1, orgId: 'org_cwn_test', role: 'admin' };
  let mockChatSendMessage;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mockClient = {
      query: sandbox.stub(),
      release: sandbox.stub(),
    };
    sandbox.stub(pool, 'connect').resolves(mockClient);
    mockClient.query.withArgs('SET app.current_org_id = $1', [testUser.orgId]).resolves();
    token = jwt.sign(testUser, SECRET_KEY, { expiresIn: '1h' });

    // Mock GoogleGenerativeAI
    mockChatSendMessage = sandbox.stub().resolves({
      response: {
        candidates: [
          {
            content: {
              parts: [{ text: 'Hello from AI!' }],
            },
          },
        ],
      },
      history: [], // Mock history
    });

    sandbox.stub(GoogleGenerativeAI.prototype, 'getGenerativeModel').returns({
      startChat: sandbox.stub().returns({
        sendMessage: mockChatSendMessage,
        getHistory: sandbox.stub().resolves([]),
      }),
    });

    // Mock retrieveAIMemory to avoid errors during system instruction creation
    sandbox.stub(AIMemory, 'retrieveAIMemory').resolves([]);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('POST /api/ai/agent/execute', () => {
    it('should return a text response from AI', async () => {
      const res = await request(app)
        .post('/api/ai/agent/execute')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: 'Hello AI' });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.response).to.equal('Hello from AI!');
      expect(mockChatSendMessage.calledOnce).to.be.true;
    });

    it('should handle AI tool call and return function response (get_places)', async () => {
      const mockPlaces = [{ place: 'Auditorio' }, { place: 'Biblioteca' }];
      sandbox.stub(Espacio, 'getPlacesByOrganization').resolves(mockPlaces);

      mockChatSendMessage.resolves({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    functionCall: {
                      name: 'get_places',
                      args: {},
                    },
                  },
                ],
              },
            },
          ],
        },
        history: [],
      });

      // Mock the second sendMessage call after tool execution
      mockChatSendMessage.onSecondCall().resolves({
        response: {
          text: () => JSON.stringify(mockPlaces),
        },
      });

      const res = await request(app)
        .post('/api/ai/agent/execute')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: 'List all places' });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.response).to.deep.equal(JSON.stringify(mockPlaces));
      expect(Espacio.getPlacesByOrganization.calledOnceWith(testUser.orgId)).to.be.true;
    });

    it('should return 400 if query is missing', async () => {
      const res = await request(app)
        .post('/api/ai/agent/execute')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Se requiere una consulta (query).');
    });

    it('should return 500 if AI sendMessage fails', async () => {
      mockChatSendMessage.throws(new Error('AI Error'));

      const res = await request(app)
        .post('/api/ai/agent/execute')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: 'Hello AI' });

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });

    it('should return 500 if a tool execution fails', async () => {
      sandbox.stub(Espacio, 'getPlacesByOrganization').throws(new Error('Tool Error'));

      mockChatSendMessage.resolves({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    functionCall: {
                      name: 'get_places',
                      args: {},
                    },
                  },
                ],
              },
            },
          ],
        },
        history: [],
      });

      const res = await request(app)
        .post('/api/ai/agent/execute')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: 'List all places' });

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });
});