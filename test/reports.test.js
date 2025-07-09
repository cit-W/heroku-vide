import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import * as Reporte from 'file:///C:/Users/jhoan/Documents/heroku-vide/models/Reporte.js';

describe('Reports Routes', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('GET /reports/report-ids', () => {
    it('should return a list of report IDs', async () => {
      sandbox.stub(Reporte, 'getIDs').resolves([{ id: 1 }, { id: 2 }]);

      const res = await request(app).get('/reports/report-ids');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 500 if fetching report IDs fails', async () => {
      sandbox.stub(Reporte, 'getIDs').throws(new Error('DB Error'));

      const res = await request(app).get('/reports/report-ids');

      expect(res.statusCode).to.equal(500);
      expect(res.body.error).to.equal('Error al obtener los IDs de reportes');
    });
  });

  describe('GET /reports/report-record', () => {
    it('should return report record if ID is valid', async () => {
      sandbox.stub(Reporte, 'getByID').resolves([{ id: 1, profesor: 'Profesor A' }]);

      const res = await request(app).get('/reports/report-record?id=1');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.not.empty;
    });

    it('should return 400 if no ID is provided', async () => {
      const res = await request(app).get('/reports/report-record');

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('No se proporcionó un ID válido');
    });

    it('should return success false if no reports are found', async () => {
      sandbox.stub(Reporte, 'getByID').resolves([]);

      const res = await request(app).get('/reports/report-record?id=999');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No se encontraron reportes');
    });

    it('should return 500 if fetching report record fails', async () => {
      poolQueryStub.withArgs('SELECT * FROM reportes WHERE id = $1 ORDER BY lugar ASC', [1]).throws(new Error('DB Error'));

      const res = await request(app).get('/reports/report-record?id=1');

      expect(res.statusCode).to.equal(500);
      expect(res.body.error).to.equal('Error al obtener el reporte');
    });
  });
});
