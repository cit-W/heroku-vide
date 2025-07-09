import { expect } from 'chai';
import sinon from 'sinon';
import User from 'file:///C:/Users/jhoan/Documents/heroku-vide/models/User.js';
import bcrypt from 'bcrypt';

describe('User Model', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('createUser', () => {
    it('should hash the password before creating a user', async () => {
      const mockClient = {
        query: sandbox.stub().resolves({ rows: [] }),
      };

      const userData = {
        personal_id: '12345',
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        organizacion_id: 1,
        role_id: 1,
        department_id: 1,
        education_levels_id: 1,
        grade_id: 1,
      };

      const hashedPassword = 'hashedPassword123';
      sandbox.stub(bcrypt, 'hash').resolves(hashedPassword);

      await User.createUser(userData, mockClient);

      expect(bcrypt.hash.calledOnceWith(userData.password, 10)).to.be.true;
      expect(mockClient.query.calledOnce).to.be.true;
      expect(mockClient.query.args[0][1][3]).to.equal(hashedPassword); 
    });
  });
});