const express = require("express");
const Organizacion = require("../models/Organizacion");
const Usuario = require("../models/Usuario");
const Grado = require("../models/Grado");
const General = require("../models/General");
const Espacio = require("../models/Espacio");
const router = express.Router();

router.get("/conexion_verification", async (req, res) => {
  try {
    const data = await General.verificarConexion();
    res.json({success: true});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en la verificación de conexión" });
  }
});

router.post("/crear_organizacion", async (req, res) => {
  try {
    await Organizacion.crearOrganizacion(req.body);
    res.json({ success: true, message: "Organización creada con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al crear la organización" });
  }
});

router.get("/obtener_organizaciones", async (req, res) => {
  try {
    const data = await Organizacion.obtenerOrganizaciones();
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al obtener organizaciones" });
  }
});

router.post("/crear_usuario", async (req, res) => {
  try {
    await Usuario.crearUsuario(req.body);
    res.json({ success: true, message: "Usuario creado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al crear usuario" });
  }
});

router.get("/obtener_usuarios", async (req, res) => {
  try {
    const data = await Usuario.obtenerUsuariosPorOrganizacion(req.query.organizacion_id);
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al obtener usuarios" });
  }
});

router.post("/crear_grado", async (req, res) => {
  try {
    await Grado.crearGrado(req.body);
    res.json({ success: true, message: "Grado creado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al crear grado" });
  }
});

router.get("/obtener_grados", async (req, res) => {
  try {
    const data = await Grado.obtenerGradosPorOrganizacion(req.query.organizacion_id);
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al obtener grados" });
  }
});

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

router.get("/info_user", async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: "No se proporcionó una cédula válida" });
  }
  try {
    const data = await General.obtenerInfoUsuario(email);
    
    // Verifica si data es nulo, un objeto único o un array
    if (!data) {
      return res.json({ success: false, message: "No se encontró usuario" });
    } 
    
    // Si es un array, verifica si tiene elementos
    if (Array.isArray(data) && data.length === 0) {
      return res.json({ success: false, message: "No se encontró usuario" });
    }
    
    // En cualquier otro caso, hay datos para devolver
    res.json({ success: true, data });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener la información del usuario" });
  }
});

module.exports = router;