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
    it('should create a user successfully', async () => {
      sandbox.stub(bcrypt, 'hash').resolves('hashedPassword');
      poolQueryStub.withArgs(sinon.match.string, sinon.match.array).resolves({});

      const res = await request(app)
        .post('/user/create-user')
        .set('Authorization', `Bearer ${token}`)
        .send({ personal_id: '123', name: 'Test User', email: 'test@example.com', password: 'password' });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Usuario registrado con éxito');
    });

    it('should return 500 if user creation fails', async () => {
      sandbox.stub(bcrypt, 'hash').resolves('hashedPassword');
      poolQueryStub.withArgs(sinon.match.string, sinon.match.array).throws(new Error('DB Error'));

      const res = await request(app)
        .post('/user/create-user')
        .set('Authorization', `Bearer ${token}`)
        .send({ personal_id: '123', name: 'Test User', email: 'test@example.com', password: 'password' });

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('POST /user/save-user-devices', () => {
    it('should save user device successfully', async () => {
      poolQueryStub.withArgs(sinon.match.string, sinon.match.array).resolves({});

      const res = await request(app)
        .post('/user/save-user-devices')
        .set('Authorization', `Bearer ${token}`)
        .send({ player_id: 'player123', device_type: 'mobile' });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Dispositivo de usuario guardado con éxito');
    });

    it('should return 500 if saving user device fails', async () => {
      poolQueryStub.withArgs(sinon.match.string, sinon.match.array).throws(new Error('DB Error'));

      const res = await request(app)
        .post('/user/save-user-devices')
        .set('Authorization', `Bearer ${token}`)
        .send({ player_id: 'player123', device_type: 'mobile' });

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /user/get-names', () => {
    it('should return user names successfully', async () => {
      poolQueryStub.withArgs(sinon.match.string, ['123']).resolves({ rows: [{ name: 'Test User' }] });

      const res = await request(app)
        .get('/user/get-names?cedula=123')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return success false if no user found', async () => {
      poolQueryStub.withArgs(sinon.match.string, ['999']).resolves({ rows: [] });

      const res = await request(app)
        .get('/user/get-names?cedula=999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No se encontró un usuario con la cédula proporcionada');
    });

    it('should return 500 if fetching user names fails', async () => {
      poolQueryStub.withArgs(sinon.match.string, ['123']).throws(new Error('DB Error'));

      const res = await request(app)
        .get('/user/get-names?cedula=123')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /user/user-info', () => {
    it('should return user info from token', async () => {
      const res = await request(app)
        .get('/user/user-info')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('userId', testUser.userId);
    });

    it('should return 500 if an error occurs', async () => {
      sandbox.stub(jwt, 'verify').throws(new Error('Invalid token'));

      const res = await request(app)
        .get('/user/user-info')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe('POST /user/sign-in', () => {
    it('should sign in user successfully and return token', async () => {
      poolQueryStub.withArgs(sinon.match.string, ['test@example.com']).resolves({ rows: [{ id: 1, email: 'test@example.com', password: 'hashedPassword', organizacion_id: 101, role: 'user' }] });
      sandbox.stub(bcrypt, 'compare').resolves(true);
      sandbox.stub(jwt, 'sign').returns('mockToken');

      const res = await request(app)
        .post('/user/sign-in')
        .send({ email: 'test@example.com', password: 'password' });

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Inicio de sesión exitoso');
      expect(res.body.token).to.equal('mockToken');
    });

    it('should return 400 if email or password missing', async () => {
      const res = await request(app)
        .post('/user/sign-in')
        .send({ email: 'test@example.com' });

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Email y contraseña son requeridos');
    });

    it('should return 401 if credentials are incorrect', async () => {
      poolQueryStub.withArgs(sinon.match.string, ['test@example.com']).resolves({ rows: [] });

      const res = await request(app)
        .post('/user/sign-in')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(res.statusCode).to.equal(401);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Credenciales incorrectas');
    });

    it('should return 500 if authentication fails', async () => {
      poolQueryStub.withArgs(sinon.match.string, ['test@example.com']).throws(new Error('Auth Error'));

      const res = await request(app)
        .post('/user/sign-in')
        .send({ email: 'test@example.com', password: 'password' });

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });
});