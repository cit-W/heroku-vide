import { Router } from "express";
import Usuario from "../models/Usuario.js";
import { crearDepartamento } from "../models/Departamento.js";
import { obtenerEscuelasPorOrganizacion } from "../models/Escuela.js";
const router = Router();

router.post("/crear_escuela", async (req, res) => {
  try {
    await crearDepartamento(req.body);
    res.json({ success: true, message: "Espacio creado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al crear espacio" });
  }
});

router.get("/obtener_escuela", async (req, res) => {
  try {
    const orgData = await Usuario.obtenerOrgId(req.query.email);

    if (orgData.length > 0) {
        const orgId = orgData[0].organizacion_id;
        const data = await obtenerEscuelasPorOrganizacion(orgId);
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

router.get("/obtener_escuela_single", async (req, res) => {
  try {

    const data = await obtenerEscuelasPorOrganizacion(req.query.orgId);
    res.json({ success: true, data });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al obtener espacios" });
  }
});

export default router;