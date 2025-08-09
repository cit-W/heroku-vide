import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import jwt from 'jsonwebtoken';
import * as Rastrear from '../models/Rastrear.js';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforlocaldev';

describe('Track Routes', () => {
  let sandbox;
  let token;
  const testUser = { userId: 1, orgId: 'org_cwn_test' };

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    token = jwt.sign(testUser, SECRET_KEY, { expiresIn: '1h' });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('GET /track/get-names', () => {
    const mockNames = [{ name: 'User A' }, { name: 'User B' }];

    it('should return names successfully', async () => {
      sandbox.stub(Rastrear, 'getNames').resolves(mockNames);

      const res = await request(app)
        .get('/track/get-names')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockNames);
      expect(Rastrear.getNames.calledOnceWith(testUser.orgId)).to.be.true;
    });

    it('should return no names message if no names found', async () => {
      sandbox.stub(Rastrear, 'getNames').resolves([]);

      const res = await request(app)
        .get('/track/get-names')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No se encontraron nombres');
    });

    it('should return 500 if getNames fails', async () => {
      sandbox.stub(Rastrear, 'getNames').throws(new Error('DB Error'));

      const res = await request(app)
        .get('/track/get-names')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.error).to.equal('Error al obtener los nombres');
    });
  });

  describe('GET /track/fuzzy_search', () => {
    const searchTerm = 'test';
    const mockResults = [{ name: 'Test User' }, { name: 'Another Test' }];

    it('should return fuzzy search results successfully', async () => {
      sandbox.stub(Rastrear, 'fuzzySearch').resolves(mockResults);

      const res = await request(app)
        .get(`/track/fuzzy_search?search=${searchTerm}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockResults);
      expect(res.body.totalResults).to.equal(mockResults.length);
      expect(Rastrear.fuzzySearch.calledOnceWith(searchTerm, testUser.orgId)).to.be.true;
    });

    it('should return 400 if search term is missing', async () => {
      const res = await request(app)
        .get(`/track/fuzzy_search`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal("El parámetro 'search' es requerido");
    });

    it('should return 500 if fuzzySearch fails', async () => {
      sandbox.stub(Rastrear, 'fuzzySearch').throws(new Error('DB Error'));

      const res = await request(app)
        .get(`/track/fuzzy_search?search=${searchTerm}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.error).to.equal('Error en la búsqueda difusa');
    });
  });
});