import express from 'express';
import { fuzzySearch, getNames } from '../models/Rastrear.js';
import { verifyToken } from '../middleware/auth.js';
const router = express.Router();

router.get('/get-names', verifyToken, async (req, res) => {
  try {
    const organizacion_id = req.user.orgId;
    const data = await getNames(organizacion_id);
    res.json(
      data.length > 0
        ? { success: true, data }
        : { success: false, message: 'No se encontraron nombres' }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los nombres' });
  }
});

router.get('/fuzzy_search', verifyToken, async (req, res) => {
  const { search } = req.query;
  if (!search) {
    return res
      .status(400)
      .json({ error: "El parámetro 'search' es requerido" });
  }
  try {
    const organizacion_id = req.user.orgId;
    const data = await fuzzySearch(search, organizacion_id);
    res.json({ success: true, data, totalResults: data.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la búsqueda difusa' });
  }
});

export default router;
