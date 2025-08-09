import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from 'file:///C:/Users/jhoan/Documents/heroku-vide/config/db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('User Auth Routes', () => {
  let sandbox;
  let mockClient;
  let token;
  const testUser = { userId: 1, orgId: 101 };
  let poolQueryStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mockClient = {
      query: sandbox.stub(),
      release: sandbox.stub(),
    };
    sandbox.stub(pool, 'connect').resolves(mockClient);
    poolQueryStub = sandbox.stub(pool, 'query');
    token = jwt.sign(testUser, SECRET_KEY, { expiresIn: '1h' });
    mockClient.query.withArgs('SET app.current_org_id = $1', [testUser.orgId]).resolves();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('POST /user/create-user', () => {
    const commonUserData = {
      personal_id: '12345',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      department_id: 1,
      role_id: 1,
      personal_permissions: true,
    };

    beforeEach(() => {
      sandbox.stub(bcrypt, 'hash').resolves('hashedPassword');
      // Mock transporter.sendMail as it's called in createUser
      sandbox.stub(User, 'transporter').value({ sendMail: sandbox.stub().resolves(true) });
    });

    it('should create a user successfully with all valid data', async () => {
      mockClient.query.withArgs(sinon.match.string, sinon.match.array).resolves({});

      const res = await request(app)
        .post('/user/create-user')
        .set('Authorization', `Bearer ${token}`)
        .send(commonUserData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Usuario registrado con éxito');
      expect(mockClient.query.calledWithMatch(
        sinon.match(/INSERT INTO users/),
        [
          commonUserData.personal_id,
          commonUserData.name,
          commonUserData.email,
          'hashedPassword',
          testUser.orgId, // orgId from token
          commonUserData.role_id,
          commonUserData.department_id,
          commonUserData.personal_permissions,
          sinon.match.string, // email_verification_token
          sinon.match.date, // email_verification_token_expires_at
        ]
      )).to.be.true;
    });

    it('should return 400 if personal_id is missing', async () => {
      const { personal_id, ...dataWithout } = commonUserData;
      const res = await request(app)
        .post('/user/create-user')
        .set('Authorization', `Bearer ${token}`)
        .send(dataWithout);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.include('personal_id'); // Assuming validation error message
    });

    it('should return 400 if email is missing', async () => {
      const { email, ...dataWithout } = commonUserData;
      const res = await request(app)
        .post('/user/create-user')
        .set('Authorization', `Bearer ${token}`)
        .send(dataWithout);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.include('email');
    });

    it('should return 400 if password is missing', async () => {
      const { password, ...dataWithout } = commonUserData;
      const res = await request(app)
        .post('/user/create-user')
        .set('Authorization', `Bearer ${token}`)
        .send(dataWithout);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.include('password');
    });

    it('should return 500 if database operation fails', async () => {
      mockClient.query.withArgs(sinon.match.string, sinon.match.array).throws(new Error('DB Error'));

      const res = await request(app)
        .post('/user/create-user')
        .set('Authorization', `Bearer ${token}`)
        .send(commonUserData);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Error interno al registrar usuario'); // Assuming generic error message
    });

    it('should handle duplicate personal_id gracefully (ON CONFLICT)', async () => {
      // Simulate ON CONFLICT DO UPDATE behavior
      mockClient.query.withArgs(sinon.match.string, sinon.match.array).resolves({ command: 'UPDATE', rowCount: 1 });

      const res = await request(app)
        .post('/user/create-user')
        .set('Authorization', `Bearer ${token}`)
        .send(commonUserData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Usuario registrado con éxito'); // Message remains the same for ON CONFLICT
    });
  });

  describe('POST /user/save-user-devices', () => {
    const commonDeviceData = {
      player_id: 'test_player_id_123',
      device_type: 'android',
      app_version: '1.0.0',
      device_model: 'Pixel 5',
      os_version: 'Android 12',
      ip_address: '192.168.1.1',
    };

    it('should save user device successfully with all valid data', async () => {
      mockClient.query.withArgs(sinon.match.string, sinon.match.array).resolves({});

      const res = await request(app)
        .post('/user/save-user-devices')
        .set('Authorization', `Bearer ${token}`)
        .send(commonDeviceData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Dispositivo de usuario guardado con éxito');
      expect(mockClient.query.calledWithMatch(
        sinon.match(/INSERT INTO user_devices/),
        [
          testUser.userId, // userId from token
          commonDeviceData.player_id,
          testUser.orgId, // orgId from token
          commonDeviceData.device_type,
          commonDeviceData.app_version,
          true, // is_active default
          sinon.match.date, // last_seen_at
          sinon.match.date, // created_at
          commonDeviceData.device_model,
          commonDeviceData.os_version,
          commonDeviceData.ip_address,
        ]
      )).to.be.true;
    });

    it('should return 400 if player_id is missing', async () => {
      const { player_id, ...dataWithout } = commonDeviceData;
      const res = await request(app)
        .post('/user/save-user-devices')
        .set('Authorization', `Bearer ${token}`)
        .send(dataWithout);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.include('player_id'); // Assuming validation error message
    });

    it('should return 500 if database operation fails', async () => {
      mockClient.query.withArgs(sinon.match.string, sinon.match.array).throws(new Error('DB Error'));

      const res = await request(app)
        .post('/user/save-user-devices')
        .set('Authorization', `Bearer ${token}`)
        .send(commonDeviceData);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Error interno al guardar dispositivo'); // Assuming generic error message
    });

    it('should handle duplicate player_id gracefully (ON CONFLICT)', async () => {
      // Simulate ON CONFLICT DO UPDATE behavior
      mockClient.query.withArgs(sinon.match.string, sinon.match.array).resolves({ command: 'UPDATE', rowCount: 1 });

      const res = await request(app)
        .post('/user/save-user-devices')
        .set('Authorization', `Bearer ${token}`)
        .send(commonDeviceData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Dispositivo de usuario guardado con éxito'); // Message remains the same for ON CONFLICT
    });
  });

  describe('GET /user/get-names', () => {
    it('should return user names successfully for a valid personalId', async () => {
      const mockPersonalData = [{ name: 'Test User 1' }, { name: 'Test User 2' }];
      sandbox.stub(General, 'getPersonal').resolves(mockPersonalData);

      const res = await request(app)
        .get('/user/get-names')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockPersonalData);
      expect(General.getPersonal.calledWith(testUser.userId)).to.be.true; // Ensure it's called with userId from token
    });

    it('should return success false if no user found', async () => {
      sandbox.stub(General, 'getPersonal').resolves([]); // Simulate no users found

      const res = await request(app)
        .get('/user/get-names')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No se encontró un usuario con la cédula proporcionada');
    });

    it('should return 500 if fetching user names fails', async () => {
      sandbox.stub(General, 'getPersonal').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/user/get-names')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Error interno al obtener la información del usuario'); // Assuming generic error message
    });
  });

  describe('GET /user/user-info', () => {
    it('should return user info from token successfully', async () => {
      const res = await request(app)
        .get('/user/user-info')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('userId', testUser.userId);
      expect(res.body.data).to.have.property('orgId', testUser.orgId);
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/user/user-info');

      expect(res.statusCode).to.equal(401);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Acceso denegado. No se proporcionó token.'); // Assuming message from verifyToken middleware
    });

    it('should return 401 if an invalid token is provided', async () => {
      const res = await request(app)
        .get('/user/user-info')
        .set('Authorization', `Bearer invalidtoken`);

      expect(res.statusCode).to.equal(401);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Token inválido.'); // Assuming message from verifyToken middleware
    });

    it('should return 500 if an unexpected error occurs', async () => {
      // Simulate an error within the route handler itself, after token verification
      sandbox.stub(express.response, 'json').throws(new Error('Unexpected error'));

      const res = await request(app)
        .get('/user/user-info')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Error interno del servidor'); // Assuming generic error message from errorHandler
    });
  });

  describe('POST /user/sign-in', () => {
    const commonSignInData = {
      email: 'test@example.com',
      password: 'password123',
    };
    const mockUser = {
      id: 1,
      email: commonSignInData.email,
      password: 'hashedPassword',
      organizacion_id: testUser.orgId,
      role_id: 1,
      personal_id: '12345',
    };

    beforeEach(() => {
      sandbox.stub(Authentication, 'authenticateUser').resolves({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      });
    });

    it('should sign in user successfully and return tokens', async () => {
      const res = await request(app)
        .post('/user/sign-in')
        .send(commonSignInData);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Inicio de sesión exitoso');
      expect(res.body.accessToken).to.equal('mockAccessToken');
      expect(res.body.refreshToken).to.equal('mockRefreshToken');
      expect(Authentication.authenticateUser.calledWith(
        commonSignInData.email,
        commonSignInData.password,
        mockClient
      )).to.be.true;
      expect(res.headers['set-cookie'][0]).to.include('refreshToken=mockRefreshToken');
    });

    it('should return 400 if email is missing', async () => {
      const { email, ...dataWithout } = commonSignInData;
      const res = await request(app)
        .post('/user/sign-in')
        .send(dataWithout);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Email y contraseña son requeridos');
    });

    it('should return 400 if password is missing', async () => {
      const { password, ...dataWithout } = commonSignInData;
      const res = await request(app)
        .post('/user/sign-in')
        .send(dataWithout);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Email y contraseña son requeridos');
    });

    it('should return 401 if authentication fails (incorrect credentials)', async () => {
      Authentication.authenticateUser.resolves({ accessToken: null, refreshToken: null });

      const res = await request(app)
        .post('/user/sign-in')
        .send(commonSignInData);

      expect(res.statusCode).to.equal(401);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Credenciales incorrectas');
    });

    it('should return 500 if an unexpected error occurs during authentication', async () => {
      Authentication.authenticateUser.throws(new Error('Authentication failed'));

      const res = await request(app)
        .post('/user/sign-in')
        .send(commonSignInData);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Error interno del servidor'); // Assuming generic error message from errorHandler
    });
  });
});