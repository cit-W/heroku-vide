import request from 'supertest';
import { expect } from 'chai';
import app from 'file:///C:/Users/jhoan/Documents/heroku-vide/app.js';
import sinon from 'sinon';
import * as Reporte from '../models/Reporte.js';

describe('Report Routes', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('GET /reports/report-ids', () => {
    const mockReportIds = [{ id: 1 }, { id: 2 }];

    it('should return report IDs successfully', async () => {
      sandbox.stub(Reporte, 'getIDs').resolves(mockReportIds);

      const res = await request(app).get('/reports/report-ids');

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockReportIds);
      expect(Reporte.getIDs.calledOnce).to.be.true;
    });

    it('should return 500 if fetching report IDs fails', async () => {
      sandbox.stub(Reporte, 'getIDs').throws(new Error('DB Error'));

      const res = await request(app).get('/reports/report-ids');

      expect(res.statusCode).to.equal(500);
      expect(res.body.error).to.equal('Error al obtener los IDs de reportes');
    });
  });

  describe('GET /reports/report-record', () => {
    const reportId = 123;
    const mockReport = [{ id: reportId, name: 'Test Report' }];

    it('should return a report record by ID successfully', async () => {
      sandbox.stub(Reporte, 'getByID').resolves(mockReport);

      const res = await request(app).get(`/reports/report-record?id=${reportId}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockReport);
      expect(Reporte.getByID.calledOnceWith(reportId)).to.be.true;
    });

    it('should return no reports message if report not found', async () => {
      sandbox.stub(Reporte, 'getByID').resolves([]);

      const res = await request(app).get(`/reports/report-record?id=999`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('No se encontraron reportes');
    });

    it('should return 400 if id is missing', async () => {
      const res = await request(app).get(`/reports/report-record`);

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('No se proporcionó un ID válido');
    });

    it('should return 500 if fetching report record fails', async () => {
      sandbox.stub(Reporte, 'getByID').throws(new Error('DB Error'));

      const res = await request(app).get(`/reports/report-record?id=${reportId}`);

      expect(res.statusCode).to.equal(500);
      expect(res.body.error).to.equal('Error al obtener el reporte');
    });
  });
});