import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import pool from '../config/db.js';
import * as Rastrear from 'file:///C:/Users/jhoan/Documents/heroku-vide/models/Rastrear.js';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('Track Routes', () => {
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

  describe('GET /track/get-names', () => {
    it('should return a list of names if authenticated', async () => {
      sandbox.stub(Rastrear, 'getNames').resolves([{ name: 'Student 1' }]);

      const res = await request(app)
        .get('/track/get-names')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return success false if no names are found', async () => {
      sandbox.stub(Rastrear, 'getNames').resolves([]);

      const res = await request(app)
        .get('/track/get-names')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No se encontraron nombres');
    });

    it('should return 500 if fetching names fails', async () => {
      sandbox.stub(Rastrear, 'getNames').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/track/get-names')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.error).to.equal('Error al obtener los nombres');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/track/get-names');

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token requerido');
    });
  });

  describe('GET /track/fuzzy_search', () => {
    it('should return search results for a given query', async () => {
      sandbox.stub(Rastrear, 'fuzzySearch').resolves([{ name: 'Student A' }]);

      const res = await request(app)
        .get('/track/fuzzy_search?search=test')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
      expect(res.body.totalResults).to.equal(1);
    });

    it('should return 400 if search parameter is missing', async () => {
      const res = await request(app)
        .get('/track/fuzzy_search')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal("El parámetro 'search' es requerido");
    });

    it('should return 500 if fuzzy search fails', async () => {
      poolQueryStub.withArgs(sinon.match.string, [testUser.orgId, 'test']).throws(new Error('DB Error'));

      const res = await request(app)
        .get('/track/fuzzy_search?search=test')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.error).to.equal('Error en la búsqueda difusa');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/track/fuzzy_search?search=test');

      expect(res.statusCode).to.equal(401);
      expect(res.body.error.message).to.equal('Token requerido');
    });
  });
});
