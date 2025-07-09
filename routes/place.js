import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  createPlace,
  getPlacesByOrganization,
} from '../models/Espacio.js';
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

router.post('/create-place', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    await createPlace({ ...req.body, organizacion_id: orgId }, req.dbClient);
    res.json({ success: true, message: 'Espacio creado con éxito' });
  } catch (error) {
    next(error);
  }
});

router.get('/get-places', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const data = await getPlacesByOrganization(orgId, req.dbClient);
    console.log(data)
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/get-single-place', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const data = await getPlacesByOrganization(orgId, req.dbClient);
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
