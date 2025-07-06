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
  const { email, player_id, device_type } = req.body;
  const orgId = req.user.orgId;

  if (!email || !player_id || !device_type) {
    return res
      .status(400)
      .json({ success: false, error: 'Faltan datos requeridos.' });
  }

  try {
    const result = await postDevice(email, player_id, device_type, orgId, req.dbClient);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  const { email } = req.query;
  const orgId = req.user.orgId;

  try {
    const result = await getDevice(email, orgId, req.dbClient);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  const { id } = req.params;
  const { device_type, last_active } = req.body;
  const orgId = req.user.orgId;

  if (!device_type && !last_active) {
    return res
      .status(400)
      .json({ success: false, error: 'No se proporcionó ningún dato para actualizar.' });
  }

  try {
    const result = await updateDevice(id, device_type, last_active, orgId, req.dbClient);

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
