import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from '../config/db.js';
import * as Account from 'file:///C:/Users/jhoan/Documents/heroku-vide/models/Account.js';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('Account Routes', () => {
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
    mockClient.query.withArgs('SET app.current_org_id = $1', [testUser.orgId]).resolves();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('DELETE /account/delete-personal-reservation/:id', () => {
    it('should delete personal reservation successfully', async () => {
      sandbox.stub(Account, 'deletePersonalReservation').resolves(true);

      const res = await request(app)
        .delete('/account/delete-personal-reservation/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Borrado exitosamente');
    });

    it('should return error if reservation not found', async () => {
      sandbox.stub(Account, 'deletePersonalReservation').resolves(false);

      const res = await request(app)
        .delete('/account/delete-personal-reservation/999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Error al borrar o el ID no existe');
    });

    it('should return 500 if deletion fails', async () => {
      sandbox.stub(Account, 'deletePersonalReservation').throws(new Error('DB Error'));

      const res = await request(app)
        .delete('/account/delete-personal-reservation/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('DELETE /account/delete-personal-social-work', () => {
    it('should delete personal social work successfully', async () => {
      sandbox.stub(Account, 'deletePersonalSocialWork').resolves(true);

      const res = await request(app)
        .delete('/account/delete-personal-social-work?id=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Borrado exitosamente');
    });

    it('should return error if social work not found', async () => {
      sandbox.stub(Account, 'deletePersonalSocialWork').resolves(false);

      const res = await request(app)
        .delete('/account/delete-personal-social-work?id=999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Error al borrar o el ID no existe');
    });

    it('should return 500 if deletion fails', async () => {
      sandbox.stub(Account, 'deletePersonalSocialWork').throws(new Error('DB Error'));

      const res = await request(app)
        .delete('/account/delete-personal-social-work?id=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('GET /account/personal-reservation-ids', () => {
    it('should return personal reservation IDs successfully', async () => {
      sandbox.stub(Account, 'getReservationsByTeacher').resolves([{ id: 1 }, { id: 2 }]);

      const res = await request(app)
        .get('/account/personal-reservation-ids?profesor=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return message if no reservations found', async () => {
      sandbox.stub(Account, 'getReservationsByTeacher').resolves([]);

      const res = await request(app)
        .get('/account/personal-reservation-ids?profesor=999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No se encontraron reservations para el profesor proporcionado');
    });

    it('should return 500 if fetching reservations fails', async () => {
      sandbox.stub(Account, 'getReservationsByTeacher').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/account/personal-reservation-ids?profesor=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
    });
  });

  describe('GET /account/personal-social-work-ids', () => {
    it('should return personal social work IDs successfully', async () => {
      sandbox.stub(Account, 'getSocialWorksByTeacher').resolves([{ id: 1 }, { id: 2 }]);

      const res = await request(app)
        .get('/account/personal-social-work-ids?profesor=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return message if no social work found', async () => {
      sandbox.stub(Account, 'getSocialWorksByTeacher').resolves([]);

      const res = await request(app)
        .get('/account/personal-social-work-ids?profesor=999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No se encontraron trabajos sociales para el profesor proporcionado');
    });

    it('should return 500 if fetching social work fails', async () => {
      mockClient.query.withArgs(sinon.match.string, sinon.match.array).throws(new Error('DB Error'));

      const res = await request(app)
        .get('/account/personal-social-work-ids?profesor=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
    });
  });
});
