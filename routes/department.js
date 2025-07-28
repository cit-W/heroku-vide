import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { createDepartment, getDepartmentsByOrganization } from '../models/Departamento.js';
import pool from '../config/db.js';

const router = express.Router();

router.use(verifyToken, async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.current_org_id', $1, false)", [
      req.user.orgId.toString(),
    ]);
    req.dbClient = client;
    next();
  } catch (error) {
    client.release();
    next(error);
  }
});

router.post('/create-department', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    await createDepartment({ ...req.body, organizacion_id: orgId }, req.dbClient);
    res.json({ success: true, message: 'Departamento creado con éxito' });
  } catch (error) {
    next(error);
  }
});

router.get('/get-departments', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const data = await getDepartmentsByOrganization(orgId, req.dbClient);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/get-single-department', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const data = await getDepartmentsByOrganization(orgId, req.dbClient);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.use((req, res, next) => {
  if (req.dbClient) {
    req.dbClient.release();
  }
  next();
});

export default router;
