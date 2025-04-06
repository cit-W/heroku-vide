import express from 'express';
import Usuario from "../models/Usuario.js";
import { agregar, obtenerIDs, obtenerPorID } from '../models/TrabajoSocial.js';
const router = express.Router();

router.post('/add_trabajo_social', async (req, res) => {
  const { name, description, hours, date, email } = req.body;

  if (!name || !description || !hours || !date || !email) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    const orgData = await Usuario.obtenerOrgId(email);
    if (orgData.length === 0) {
      return res.status(404).json({ success: false, error: "Organización no encontrada" });
    }

    const orgId = orgData[0].organizacion_id;
    await agregar(name, description, hours, date, orgId);
    res.json({ message: 'Trabajo social registrado' });

  } catch (error) {
    console.error("❌ Error al registrar trabajo social:", error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

router.get('/ids', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email es requerido' });
  }

  try {
    const orgData = await Usuario.obtenerOrgId(email);

    if (orgData.length === 0) {
      return res.status(404).json({ success: false, error: "Organización no encontrada" });
    }

    const orgId = orgData[0].organizacion_id;
    const data = await obtenerIDs(orgId);

    res.json({ success: true, data });

  } catch (error) {
    console.error("❌ Error al obtener IDs:", error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

router.get('/registro_trabajo_social', async (req, res) => {
  const { id, email } = req.query;

  if (!id || !email) {
    return res.status(400).json({ error: 'ID y email son requeridos' });
  }

  try {
    const orgData = await Usuario.obtenerOrgId(email);

    if (orgData.length === 0) {
      return res.status(404).json({ success: false, error: "Organización no encontrada" });
    }

    const orgId = orgData[0].organizacion_id;
    const data = await obtenerPorID(id, orgId);

    if (!data) {
      return res.status(404).json({ success: false, message: 'Registro no encontrado' });
    }

    res.json({ success: true, data });

  } catch (error) {
    console.error("❌ Error al obtener registro:", error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

export default router;