import express from "express";
import Usuario from "../models/Usuario.js";
import {crearEspacio, 
  obtenerEspaciosPorOrganizacion
} from "../models/Espacio.js";
const router = express.Router();

router.post("/crear_espacio", async (req, res) => {
  try {
    await crearEspacio(req.body);
    res.json({ success: true, message: "Espacio creado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al crear espacio" });
  }
});

router.get("/obtener_espacios", async (req, res) => {
  try {
    const orgData = await Usuario.obtenerOrgId(req.query.email);

    if (orgData.length > 0) {
        const orgId = orgData[0].organizacion_id;
        const data = await obtenerEspaciosPorOrganizacion(orgId);
        res.json({ success: true, data });

    } else {
        console.error("❌ No se encontró la organización para el email proporcionado.");
        res.json({ success: false, error: "Error en las consultas." });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al obtener espacios" });
  }
});

router.get("/obtener_espacio_single", async (req, res) => {
  try {

    const data = await obtenerEspaciosPorOrganizacion(req.query.orgId);
    res.json({ success: true, data });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al obtener espacios" });
  }
});

export default router;