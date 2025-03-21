const express = require("express");
const Usuario = require("../models/Usuario");
const Departamento = require("../models/Departamento");
const Escuela = require("../models/Escuela");
const router = express.Router();

router.post("/crear_escuela", async (req, res) => {
  try {
    await Departamento.crearDepartamento(req.body);
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
        const data = await Escuela.obtenerEscuelasPorOrganizacion(orgId);
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

    const data = await Escuela.obtenerEscuelasPorOrganizacion(req.query.orgId);
    res.json({ success: true, data });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al obtener espacios" });
  }
});

module.exports = router;