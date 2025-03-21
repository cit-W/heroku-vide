import express from "express";
import {} from "../models/Organizacion.js";
import Usuario from "../models/Usuario.js";
import {crearGrado, obtenerGradosPorOrganizacion} from "../models/Grado.js";
const router = express.Router();

router.post("/crear_grado", async (req, res) => {
  try {
    await crearGrado(req.body);
    res.json({ success: true, message: "Grado creado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al crear grado" });
  }
});

router.get("/obtener_grados", async (req, res) => {
  try {
    const orgData = await Usuario.obtenerOrgId(req.query.email);

    if (orgData.length > 0) {
        const orgId = orgData[0].organizacion_id;
        const data = await obtenerGradosPorOrganizacion(orgId);
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

router.get("/obtener_grado_single", async (req, res) => {
  try {

    const data = await obtenerGradosPorOrganizacion(req.query.orgId);
    res.json({ success: true, data });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al obtener espacios" });
  }
});

export default router;