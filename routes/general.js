import express from "express";
import {crearOrganizacion, obtenerOrganizaciones} from "../models/Organizacion.js";
import Usuario from "../models/Usuario.js";
import {verificarConexion, obtenerInfoUsuario} from "../models/General.js";
const router = express.Router();

router.get("/conexion_verification", async (req, res) => {
  try {
    const data = await verificarConexion();
    res.json({success: true});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en la verificación de conexión" });
  }
});

router.post("/crear_organizacion", async (req, res) => {
  try {
    await crearOrganizacion(req.body);
    res.json({ success: true, message: "Organización creada con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al crear la organización" });
  }
});

router.get("/obtener_organizaciones", async (req, res) => {
  try {
    const data = await obtenerOrganizaciones();
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al obtener organizaciones" });
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

router.get("/info_user", async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: "No se proporcionó una cédula válida" });
  }
  try {
    const data = await obtenerInfoUsuario(email);
    
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

export default router;