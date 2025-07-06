import request from 'supertest';
import { expect } from 'chai';
import app from '../app.js'; // Asegúrate de que tu app Express sea exportada desde index.js
import jwt from 'jsonwebtoken';
import sinon from 'sinon';
import pool from '../config/db.js';
import * as auth from '../middleware/auth.js';

const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key'; // Usa una clave secreta para pruebas

describe('User Routes', () => {
  let sandbox;
  let mockClient;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mockClient = {
      query: sandbox.stub(),
      release: sandbox.stub(),
    };
    sandbox.stub(pool, 'connect').resolves(mockClient);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('GET /user-reservations/get-reservation-ids', () => {
    it('should return reservation IDs if authenticated', async () => {
      const testUser = { userId: 1, orgId: 101 };
      const token = jwt.sign(testUser, SECRET_KEY, { expiresIn: '1h' });

      mockClient.query.withArgs('SET app.current_org_id = $1', [testUser.orgId]).resolves();
      mockClient.query.withArgs('SELECT * FROM reservation_details WHERE organizacion_id = $1 ORDER BY place;', [testUser.orgId]).resolves({ rows: [{ id: 1, name: 'Reserva 1' }] });

      const res = await request(app)
        .get('/user-reservations/get-reservation-ids')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
      expect(mockClient.query.calledWith('SET app.current_org_id = $1', [testUser.orgId])).to.be.true;
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/user-reservations/get-reservation-ids');

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token requerido');
    });

    it('should return 401 if token is invalid', async () => {
      const res = await request(app)
        .get('/user-reservations/get-reservation-ids')
        .set('Authorization', `Bearer invalidtoken`);

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token inválido o expirado');
    });
  });
});
