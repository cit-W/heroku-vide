import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import jwt from 'jsonwebtoken';
import sinon from 'sinon';
import pool from '../config/db.js';


const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('Reservations Routes', () => {
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

  describe('GET /reservations/get-reservation-ids', () => {
    it('should return reservation IDs if authenticated', async () => {
      sandbox.stub(Reservation, 'getReservationsByOrganization').resolves([{ id: 1, name: 'Reserva 1' }]);

      const res = await request(app)
        .get('/reservations/get-reservation-ids')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/reservations/get-reservation-ids');

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token requerido');
    });

    it('should return 500 if fetching reservation IDs fails', async () => {
      sandbox.stub(Reservation, 'getReservationsByOrganization').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/reservations/get-reservation-ids')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /reservations/get-reservation-record', () => {
    it('should return reservation record if ID is valid', async () => {
      sandbox.stub(Reservation, 'getReservationById').resolves({ id: 1, name: 'Reserva 1' });

      const res = await request(app)
        .get('/reservations/get-reservation-record?id=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('id', 1);
    });

    it('should return 400 if no ID is provided', async () => {
      const res = await request(app)
        .get('/reservations/get-reservation-record')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('No se proporcionó un ID válido');
    });

    it('should return 404 if reservation not found', async () => {
      sandbox.stub(Reservation, 'getReservationById').resolves(null);

      const res = await request(app)
        .get('/reservations/get-reservation-record?id=999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('Reserva no encontrada');
    });

    it('should return 500 if fetching reservation record fails', async () => {
      sandbox.stub(Reservation, 'getReservationById').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/reservations/get-reservation-record?id=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('POST /reservations/report-reservation', () => {
    const validReportData = {
      clase: 'Matemáticas',
      lugar: 'Aula 101',
      hora_inicio: new Date().toISOString(),
      hora_final: new Date(Date.now() + 3600000).toISOString(),
    };

    it('should report a reservation with valid data', async () => {
      sandbox.stub(Reservation, 'reportReservation').resolves({});

      const res = await request(app)
        .post('/reservations/report-reservation')
        .set('Authorization', `Bearer ${token}`)
        .send(validReportData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.equal('Reporte registrado con éxito');
    });

    it('should return 400 if data is missing', async () => {
      const res = await request(app)
        .post('/reservations/report-reservation')
        .set('Authorization', `Bearer ${token}`)
        .send({ clase: 'Matemáticas' }); 

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('Faltan datos');
    });

    it('should return 500 if reporting reservation fails', async () => {
      sandbox.stub(Reservation, 'reportReservation').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/reservations/report-reservation')
        .set('Authorization', `Bearer ${token}`)
        .send(validReportData);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('POST /reservations/book-place', () => {
    const validBookData = {
      clase: 'Historia',
      lugar: 'Biblioteca',
      hora_inicio: new Date().toISOString(),
      hora_final: new Date(Date.now() + 7200000).toISOString(),
    };

    it('should book a place with valid data', async () => {
      sandbox.stub(Reservation, 'bookPlace').resolves({});

      const res = await request(app)
        .post('/reservations/book-place')
        .set('Authorization', `Bearer ${token}`)
        .send(validBookData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.equal('Reserva registrada con éxito');
    });

    it('should return 400 if data is missing', async () => {
      const res = await request(app)
        .post('/reservations/book-place')
        .set('Authorization', `Bearer ${token}`)
        .send({ clase: 'Historia' }); 

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('Faltan datos');
    });

    it('should return 409 if booking conflicts with an existing reservation', async () => {
      const error = new Error('El lugar no está disponible en el horario solicitado.');
      error.status = 409;
      sandbox.stub(Reservation, 'bookPlace').throws(error);

      const res = await request(app)
        .post('/reservations/book-place')
        .set('Authorization', `Bearer ${token}`)
        .send(validBookData);

      expect(res.statusCode).to.equal(409);
      expect(res.body.success).to.be.false;
      expect(res.body.error.message).to.equal('El lugar no está disponible en el horario solicitado.');
    });

    it('should return 500 if booking place fails', async () => {
      sandbox.stub(Reservation, 'bookPlace').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/reservations/book-place')
        .set('Authorization', `Bearer ${token}`)
        .send(validBookData);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('POST /reservations/delete-expired-reservations', () => {
    it('should delete expired reservations successfully', async () => {
      sandbox.stub(Reservation, 'deleteExpired').resolves({ updatedCount: 1, updatedIds: [1] });

      const res = await request(app)
        .post('/reservations/delete-expired-reservations')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('updatedCount', 1);
    });

    it('should return 500 if deleting expired reservations fails', async () => {
      sandbox.stub(Reservation, 'deleteExpired').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/reservations/delete-expired-reservations')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('POST /reservations/check-reservation-availability', () => {
    const validCheckData = {
      lugar: 'Aula 101',
      clase: 'Matemáticas',
      hora_inicio: new Date().toISOString(),
      hora_final: new Date(Date.now() + 3600000).toISOString(),
    };

    it('should return availability status', async () => {
      sandbox.stub(Reservation, 'checkAvailability').resolves({ disponible: true });

      const res = await request(app)
        .post('/reservations/check-reservation-availability')
        .set('Authorization', `Bearer ${token}`)
        .send(validCheckData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('disponible', true);
    });

    it('should return 400 if data is missing', async () => {
      const res = await request(app)
        .post('/reservations/check-reservation-availability')
        .set('Authorization', `Bearer ${token}`)
        .send({ lugar: 'Aula 101' }); 

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('Faltan datos');
    });

    it('should return 500 if checking availability fails', async () => {
      sandbox.stub(Reservation, 'checkAvailability').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/reservations/check-reservation-availability')
        .set('Authorization', `Bearer ${token}`)
        .send(validCheckData);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });
});
