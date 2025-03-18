const express = require("express");
const Reporte = require("../../models/Reporte");
const router = express.Router();

router.get("/IDsReportes", async (req, res) => {
  try {
    const data = await Reporte.obtenerIDs();
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los IDs de reportes" });
  }
});

router.get("/registro_reportes", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "No se proporcionó un ID válido" });

  try {
    const data = await Reporte.obtenerPorID(id);
    res.json(data.length ? { success: true, data } : { success: false, message: "No se encontraron reportes" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el reporte" });
  }
});

module.exports = router;