import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { createGrade, getGradesByOrganization } from '../models/Grado.js';
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

router.post('/create-grade', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    await createGrade({ ...req.body, organizacion_id: orgId }, req.dbClient);
    res.json({ success: true, message: 'Grado creado con éxito' });
  } catch (error) {
    next(error);
  }
});

router.get('/get-grades', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const data = await getGradesByOrganization(orgId, req.dbClient);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/get-single-grade', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const data = await getGradesByOrganization(orgId, req.dbClient);
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
