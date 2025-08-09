import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from 'file:///C:/Users/jhoan/Documents/heroku-vide/config/db.js';
import jwt from 'jsonwebtoken';
import Reservation from '../models/Reserva.js';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('User Reservations Routes', () => {
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
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('GET /user-reservations/get-reservation-ids', () => {
    const mockReservations = [{ id: 1, place: 'Auditorio' }];

    it('should return reservation IDs successfully', async () => {
      sandbox.stub(Reservation, 'getReservationsByOrganization').resolves(mockReservations);

      const res = await request(app)
        .get('/user-reservations/get-reservation-ids')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockReservations);
      expect(Reservation.getReservationsByOrganization.calledOnceWith(testUser.orgId, mockClient)).to.be.true;
    });

    it('should return 500 if getReservationsByOrganization fails', async () => {
      sandbox.stub(Reservation, 'getReservationsByOrganization').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/user-reservations/get-reservation-ids')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /user-reservations/get-reservation-record', () => {
    const reservationId = 123;
    const mockReservation = { id: reservationId, place: 'Auditorio', user_id: 1 };

    it('should return a reservation record by ID successfully', async () => {
      sandbox.stub(Reservation, 'getReservationById').resolves(mockReservation);

      const res = await request(app)
        .get(`/user-reservations/get-reservation-record?id=${reservationId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockReservation);
      expect(Reservation.getReservationById.calledOnceWith(reservationId, mockClient)).to.be.true;
    });

    it('should return 404 if reservation not found', async () => {
      sandbox.stub(Reservation, 'getReservationById').resolves(null);

      const res = await request(app)
        .get(`/user-reservations/get-reservation-record?id=999`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('Reserva no encontrada');
    });

    it('should return 400 if id is missing', async () => {
      const res = await request(app)
        .get(`/user-reservations/get-reservation-record`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('No se proporcionó un ID válido');
    });

    it('should return 500 if getReservationById fails', async () => {
      sandbox.stub(Reservation, 'getReservationById').throws(new Error('DB Error'));

      const res = await request(app)
        .get(`/user-reservations/get-reservation-record?id=${reservationId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('POST /user-reservations/report-reservation', () => {
    const reportData = {
      clase: 'Clase de Prueba',
      lugar: 'Aula 101',
      hora_inicio: '2025-08-01T09:00:00Z',
      hora_final: '2025-08-01T10:00:00Z',
    };

    it('should report a reservation successfully', async () => {
      sandbox.stub(Reservation, 'reportReservation').resolves({});

      const res = await request(app)
        .post('/user-reservations/report-reservation')
        .set('Authorization', `Bearer ${token}`)
        .send(reportData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.equal('Reporte registrado con éxito');
      expect(Reservation.reportReservation.calledOnceWith(
        testUser.userId, reportData.clase, reportData.lugar, reportData.hora_inicio, reportData.hora_final, testUser.orgId, mockClient
      )).to.be.true;
    });

    it('should return 400 if data is missing', async () => {
      const { clase, ...dataWithout } = reportData;
      const res = await request(app)
        .post('/user-reservations/report-reservation')
        .set('Authorization', `Bearer ${token}`)
        .send(dataWithout);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('Faltan datos');
    });

    it('should return 500 if reportReservation fails', async () => {
      sandbox.stub(Reservation, 'reportReservation').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/user-reservations/report-reservation')
        .set('Authorization', `Bearer ${token}`)
        .send(reportData);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('POST /user-reservations/book-place', () => {
    const bookData = {
      clase: 'Clase de Matemáticas',
      lugar: 'Laboratorio de Cómputo',
      hora_inicio: '2025-08-02T10:00:00Z',
      hora_final: '2025-08-02T11:00:00Z',
    };

    it('should book a place successfully', async () => {
      sandbox.stub(Reservation, 'bookPlace').resolves({});

      const res = await request(app)
        .post('/user-reservations/book-place')
        .set('Authorization', `Bearer ${token}`)
        .send(bookData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.equal('Reserva registrada con éxito');
      expect(Reservation.bookPlace.calledOnceWith(
        testUser.userId, bookData.clase, bookData.lugar, bookData.hora_inicio, bookData.hora_final, testUser.orgId, mockClient
      )).to.be.true;
    });

    it('should return 400 if data is missing', async () => {
      const { clase, ...dataWithout } = bookData;
      const res = await request(app)
        .post('/user-reservations/book-place')
        .set('Authorization', `Bearer ${token}`)
        .send(dataWithout);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.data).to.equal('Faltan datos');
    });

    it('should return 500 if bookPlace fails', async () => {
      sandbox.stub(Reservation, 'bookPlace').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/user-reservations/book-place')
        .set('Authorization', `Bearer ${token}`)
        .send(bookData);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });
});