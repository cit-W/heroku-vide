import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { createEducationLevel, getEducationLevelsByOrganization } from '../models/Escuela.js';
import pool from '../config/db.js';

const router = Router();

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

router.post('/create-education-level', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    await createEducationLevel({ ...req.body, organizacion_id: orgId }, req.dbClient);
    res.json({ success: true, message: 'Escuela creada con éxito' });
  } catch (error) {
    next(error);
  }
});

router.get('/get-education-levels', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const data = await getEducationLevelsByOrganization(orgId, req.dbClient);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/get-single-education-level', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const data = await getEducationLevelsByOrganization(orgId, req.dbClient);
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
