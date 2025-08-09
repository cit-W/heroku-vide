import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from 'file:///C:/Users/jhoan/Documents/heroku-vide/config/db.js';
import jwt from 'jsonwebtoken';
import * as Account from '../models/Account.js';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('Account Routes', () => {
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

  describe('DELETE /account/delete-personal-reservation/:id', () => {
    it('should delete personal reservation successfully', async () => {
      sandbox.stub(Account, 'deletePersonalReservation').resolves(true);

      const res = await request(app)
        .delete('/account/delete-personal-reservation/123')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Borrado exitosamente');
      expect(Account.deletePersonalReservation.calledWith('123', testUser.orgId, mockClient)).to.be.true;
    });

    it('should return error if reservation not found or deletion fails', async () => {
      sandbox.stub(Account, 'deletePersonalReservation').resolves(false);

      const res = await request(app)
        .delete('/account/delete-personal-reservation/999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Error al borrar o el ID no existe');
    });

    it('should return 500 if an error occurs during deletion', async () => {
      sandbox.stub(Account, 'deletePersonalReservation').throws(new Error('DB Error'));

      const res = await request(app)
        .delete('/account/delete-personal-reservation/123')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('DELETE /account/delete-personal-social-work', () => {
    it('should delete personal social work successfully', async () => {
      sandbox.stub(Account, 'deletePersonalSocialWork').resolves(true);

      const res = await request(app)
        .delete('/account/delete-personal-social-work?id=456')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Borrado exitosamente');
      expect(Account.deletePersonalSocialWork.calledWith('456', testUser.orgId, mockClient)).to.be.true;
    });

    it('should return error if social work not found or deletion fails', async () => {
      sandbox.stub(Account, 'deletePersonalSocialWork').resolves(false);

      const res = await request(app)
        .delete('/account/delete-personal-social-work?id=999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Error al borrar o el ID no existe');
    });

    it('should return 500 if an error occurs during deletion', async () => {
      sandbox.stub(Account, 'deletePersonalSocialWork').throws(new Error('DB Error'));

      const res = await request(app)
        .delete('/account/delete-personal-social-work?id=456')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /account/personal-reservation-ids', () => {
    it('should return personal reservation IDs successfully', async () => {
      const mockReservations = [{ id: 1, date: '2025-01-01' }];
      sandbox.stub(Account, 'getReservationsByTeacher').resolves(mockReservations);

      const res = await request(app)
        .get('/account/personal-reservation-ids?profesor=TeacherName')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockReservations);
      expect(Account.getReservationsByTeacher.calledWith('TeacherName', testUser.orgId, mockClient)).to.be.true;
    });

    it('should return message if no reservations found', async () => {
      sandbox.stub(Account, 'getReservationsByTeacher').resolves([]);

      const res = await request(app)
        .get('/account/personal-reservation-ids?profesor=NoTeacher')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No se encontraron reservations para el profesor proporcionado');
    });

    it('should return 500 if an error occurs during fetching', async () => {
      sandbox.stub(Account, 'getReservationsByTeacher').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/account/personal-reservation-ids?profesor=TeacherName')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /account/personal-social-work-ids', () => {
    it('should return personal social work IDs successfully', async () => {
      const mockSocialWorks = [{ id: 1, description: 'Cleaning', hours: 5 }];
      sandbox.stub(Account, 'getSocialWorksByTeacher').resolves(mockSocialWorks);

      const res = await request(app)
        .get('/account/personal-social-work-ids?profesor=TeacherName')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockSocialWorks);
      expect(Account.getSocialWorksByTeacher.calledWith('TeacherName', testUser.orgId, mockClient)).to.be.true;
    });

    it('should return message if no social works found', async () => {
      sandbox.stub(Account, 'getSocialWorksByTeacher').resolves([]);

      const res = await request(app)
        .get('/account/personal-social-work-ids?profesor=NoTeacher')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No se encontraron trabajos sociales para el profesor proporcionado');
    });

    it('should return 500 if an error occurs during fetching', async () => {
      sandbox.stub(Account, 'getSocialWorksByTeacher').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/account/personal-social-work-ids?profesor=TeacherName')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });
});