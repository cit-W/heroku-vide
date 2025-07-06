import express from 'express';
import { verifyToken } from '../../middleware/auth.js';
import {createAppointment,getAppointments,updateAppointment,getTables,} from '../../models/Citacion.js';
import pool from '../../config/db.js'; 

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

router.post('/create_citation', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    await createAppointment({ ...req.query, organizacion_id: orgId }, req.dbClient);
    res.json({ success: true, message: 'Citación creada con éxito' });
  } catch (error) {
    next(error);
  }
});

router.get('/get_citations', async (req, res, next) => {
  try {
    const { person, status } = req.query;
    const orgId = req.user.orgId;
    if (!person || !status)
      return res.status(400).json({ error: 'Faltan parámetros' });

    const data = await getAppointments(person, status, orgId, req.dbClient);
    res.json(
      data.length
        ? { success: true, data }
        : { success: false, message: 'No hay citas' }
    );
  } catch (error) {
    next(error);
  }
});

router.put('/update_citation', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    await updateAppointment({ ...req.query, organizacion_id: orgId }, req.dbClient);
    res.json({ success: true, message: 'Citación actualizada' });
  } catch (error) {
    next(error);
  }
});

router.get('/ids_appointments', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const data = await getTables(orgId, req.dbClient);
    res.json(
      data.length
        ? { success: true, data }
        : { success: false, message: 'No hay tablas disponibles' }
    );
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
