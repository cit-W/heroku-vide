const express = require("express");
const Organizacion = require("../models/Organizacion");
const Usuario = require("../models/Usuario");
const Grado = require("../models/Grado");
const General = require("../models/General");
const Espacio = require("../models/Espacio");
const router = express.Router();

router.post("/crear_espacio", async (req, res) => {
  try {
    await Espacio.crearEspacio(req.body);
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
        const data = await Espacio.obtenerEspaciosPorOrganizacion(orgId);
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

module.exports = router;