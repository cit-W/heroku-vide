import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { createRole, getRolesByOrganization } from '../models/Role.js';
import pool from '../config/db.js';

const router = express.Router();

router.use(verifyToken, async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('SET app.current_org_id = $1', [req.user.orgId]);
    req.dbClient = client;
    next();
  } catch (error) {
    client.release();
    next(error);
  }
});

router.post('/create-role', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const { role_code, role_name } = req.body;
    await createRole({ role_code, role_name, organizacion_id: orgId }, req.dbClient);
    res.json({ success: true, message: 'Rol creado con éxito' });
  } catch (error) {
    next(error);
  }
});

router.get('/get-roles', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const data = await getRolesByOrganization(orgId, req.dbClient);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/roles-in-organization', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const count = await countRolesByOrganization(orgId, req.dbClient);
    res.json({ success: true, count });
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
