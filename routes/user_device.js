import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  postDevice,
  getDevice,
  updateDevice,
  deleteDevice,
} from '../models/UserDevices.js';
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

router.post('/', async (req, res, next) => {
  const { user_id, player_id, ...otherData } = req.body;
  const orgId = req.user.orgId;

  if (!user_id || !player_id) {
    return res
      .status(400)
      .json({ success: false, error: 'Faltan user_id o player_id.' });
  }

  try {
    const result = await postDevice(
      { user_id, player_id, organizacion_id: orgId, ...otherData },
      req.dbClient
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  const { user_id } = req.query;
  const orgId = req.user.orgId;

  try {
    const result = await getDevice(user_id, orgId, req.dbClient);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  const { id } = req.params;
  const orgId = req.user.orgId;

  try {
    const result = await updateDevice(id, { ...req.body, organizacion_id: orgId }, req.dbClient);

    if (!result) {
      return res
        .status(404)
        .json({ success: false, error: 'Dispositivo no encontrado.' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  const orgId = req.user.orgId;

  try {
    const result = await deleteDevice(id, orgId, req.dbClient);
    if (!result) {
      return res
        .status(404)
        .json({ success: false, error: 'Dispositivo no encontrado.' });
    }
    res.json({ success: true, message: 'Dispositivo eliminado correctamente.' });
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
