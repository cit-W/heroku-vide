import express from "express";
import {agregar, obtenerIDs, obtenerPorID} from "../models/TrabajoSocial.js";
const router = express.Router();

router.post("/add_trabajo_social", async (req, res) => {
  const { profesor, descripcion, cantidad_horas, cuando } = req.body;
  if (!profesor || !descripcion || !cantidad_horas || !cuando) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    await agregar(profesor, descripcion, cantidad_horas, cuando);
    res.json({ message: "Trabajo social registrado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar el trabajo social" });
  }
});

router.get("/ids", async (req, res) => {
  try {
    const data = await obtenerIDs();
    res.json(data ? { success: true, data } : { success: false, message: "No se encontraron registros" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los IDs" });
  }
});

router.get("/registro_trabajo_social", async (req, res) => {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "No se proporcionó un ID válido" });
  }

  try {
    const data = await obtenerPorID(id);
    res.json(data ? { success: true, data } : { success: false, message: "No se encontraron registros" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los registros" });
  }
});

export default router;