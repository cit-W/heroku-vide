import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from 'file:///C:/Users/jhoan/Documents/heroku-vide/config/db.js';
import User from '../models/User.js';

describe('Verify Routes', () => {
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

  describe('GET /auth/verify-email', () => {
    const validToken = 'valid_token';
    const invalidToken = 'invalid_token';
    const mockUser = { id: 1, email: 'test@example.com' };

    it('should verify email successfully with a valid token', async () => {
      sandbox.stub(User, 'verifyEmail').resolves(mockUser);

      const res = await request(app).get(`/auth/verify-email?token=${validToken}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Email verified successfully');
      expect(User.verifyEmail.calledOnceWith(validToken, mockClient)).to.be.true;
    });

    it('should return 400 for an invalid or expired token', async () => {
      sandbox.stub(User, 'verifyEmail').resolves(null);

      const res = await request(app).get(`/auth/verify-email?token=${invalidToken}`);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Invalid or expired token');
      expect(User.verifyEmail.calledOnceWith(invalidToken, mockClient)).to.be.true;
    });

    it('should return 500 if an error occurs during verification', async () => {
      sandbox.stub(User, 'verifyEmail').throws(new Error('DB Error'));

      const res = await request(app).get(`/auth/verify-email?token=${validToken}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });
});