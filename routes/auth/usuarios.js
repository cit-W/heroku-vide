import express from "express";
import Usuario from "../../models/Usuario.js";
import { autenticarUsuario } from "../../models/Authentication.js";
import { verifyToken } from "../../middleware/errorHandler.js";
const router = express.Router();

router.post("/create_user", async (req, res) => {
  try {
    await Usuario.crearUsuario(req.body);
    res.json({ success: true, message: "Usuario registrado con éxito" });
  } catch (error) {
    console.error("Error en /create_user:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/save_user_devides", async (req, res) => {
  try {
    await Usuario.crearUsuario(req.body);
    res.json({ success: true, message: "Usuario registrado con éxito" });
  } catch (error) {
    console.error("Error en /create_user:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/obtener_nombres", async (req, res) => {
  try {
    const data = await Usuario.obtenerPorCedula(req.query.cedula);
    res.json(
      data.length
        ? { success: true, data }
        : { success: false, message: "No se encontró un usuario con la cédula proporcionada" }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/info_user", verifyToken, async (req, res) => {
  try {
    const data = await Usuario.obtenerOrgId(req.query.email);
    console.log("Datos obtenidos:", data); // <-- Agrega este log
    res.json(
      data.length
        ? { success: true, data }
        : { success: false, message: "No se encontraron items para la cédula proporcionada" }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/sign_in", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email y contraseña son requeridos" });
    }

    const token = await autenticarUsuario(email, password);

    if (token) {
      res.json({ success: true, message: "Inicio de sesión exitoso", token });
    } else {
      res.status(401).json({ success: false, message: "Credenciales incorrectas" });
    }
  } catch (error) {
    console.error("Error en /sign_in:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;