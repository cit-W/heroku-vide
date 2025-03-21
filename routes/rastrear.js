import express from "express";
import {fuzzySearch, obtenerNombres} from "../models/Rastrear.js";
const router = express.Router();

router.get("/obtener_nombres", async (req, res) => {
  try {
    const data = await obtenerNombres();
    res.json(data.length > 0 ? { success: true, data } : { success: false, message: "No se encontraron nombres" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los nombres" });
  }
});

router.get("/fuzzy_search", async (req, res) => {
  const { search } = req.query;
  if (!search) {
    return res.status(400).json({ error: "El parámetro 'search' es requerido" });
  }
  try {
    const data = await fuzzySearch(search);
    res.json({ success: true, data, totalResults: data.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en la búsqueda difusa" });
  }
});

export default router;