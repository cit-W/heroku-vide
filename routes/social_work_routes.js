import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { addSocialWork, getIDs, getByID } from '../models/TrabajoSocial.js';
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

router.post('/add-social-work', async (req, res, next) => {
  const { name, description, hours, date } = req.body;
  const orgId = req.user.orgId;

  if (!name || !description || !hours || !date) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    await addSocialWork(name, description, hours, date, orgId, req.dbClient);
    res.json({ message: 'Trabajo social registrado' });
  } catch (error) {
    next(error);
  }
});

router.get('/get-ids', async (req, res, next) => {
  const orgId = req.user.orgId;

  try {
    const data = await getIDs(orgId, req.dbClient);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/get-social-work-record', async (req, res, next) => {
  const { id } = req.query;
  const orgId = req.user.orgId;

  if (!id) {
    return res.status(400).json({ error: 'ID es requerido' });
  }

  try {
    const data = await getByID(id, orgId, req.dbClient);

    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: 'Registro no encontrado' });
    }

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