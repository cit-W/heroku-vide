import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from 'file:///C:/Users/jhoan/Documents/heroku-vide/config/db.js';
import * as Authentication from '../models/Authentication.js';

describe('Refresh Token Routes', () => {
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

  describe('POST /auth/refresh-token', () => {
    const validRefreshToken = 'valid_refresh_token';
    const newAccessToken = 'new_access_token';

    it('should return a new access token with a valid refresh token', async () => {
      sandbox.stub(Authentication, 'verifyRefreshToken').resolves(newAccessToken);

      const res = await request(app)
        .post('/auth/refresh-token')
        .send({ refreshToken: validRefreshToken });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.accessToken).to.equal(newAccessToken);
      expect(Authentication.verifyRefreshToken.calledOnceWith(validRefreshToken, mockClient)).to.be.true;
    });

    it('should return 401 if refresh token is not provided', async () => {
      const res = await request(app)
        .post('/auth/refresh-token')
        .send({});

      expect(res.statusCode).to.equal(401);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Refresh token no proporcionado');
    });

    it('should return 403 if refresh token is invalid', async () => {
      sandbox.stub(Authentication, 'verifyRefreshToken').resolves(null);

      const res = await request(app)
        .post('/auth/refresh-token')
        .send({ refreshToken: 'invalid_refresh_token' });

      expect(res.statusCode).to.equal(403);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Invalid refresh token');
    });

    it('should return 500 if an error occurs during verification', async () => {
      sandbox.stub(Authentication, 'verifyRefreshToken').throws(new Error('DB Error'));

      const res = await request(app)
        .post('/auth/refresh-token')
        .send({ refreshToken: validRefreshToken });

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });
});