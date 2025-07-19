import express from 'express';
import {
  createOrganization,
  getOrganizations,
} from '../models/Organizacion.js';
import User from '../models/User.js';
import { checkConnection, getUserInfo } from '../models/General.js';
const router = express.Router();

router.get('/connection-verification', async (req, res) => {
  try {
    const data = await checkConnection();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la verificación de conexión' });
  }
});

router.post('/create-organization', async (req, res) => {
  try {
    await createOrganization(req.body);
    res.json({ success: true, message: 'Organización creada con éxito' });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, error: 'Error al crear la organización' });
  }
});

router.get('/get-organizations', async (req, res) => {
  try {
    const data = await getOrganizations();
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, error: 'Error al obtener organizations' });
  }
});

router.get('/get-users', async (req, res) => {
  try {
    const data = await User.getUsersByOrganization(
      req.query.organizacion_id
    );
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, error: 'Error al obtener usuarios' });
  }
});

export default router;