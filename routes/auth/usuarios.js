import express from "express";
import Usuario from "../../models/Usuario.js";
import { autenticarUsuario } from "../../models/Authentication.js";
import { verifyToken } from "../../middleware/auth.js";
import pool from '../../config/db.js'; // Importar el pool de conexiones

const router = express.Router();

// Middleware para manejar la conexión y el RLS
router.use(async (req, res, next) => {
  const client = await pool.connect();
  try {
    // Solo establecer la variable de sesión si hay un usuario autenticado
    if (req.user && req.user.orgId) {
      await client.query('SET app.current_org_id = $1', [req.user.orgId]);
    }
    req.dbClient = client; // Adjuntar el cliente a la solicitud
    next();
  } catch (error) {
    client.release(); // Liberar el cliente en caso de error
    next(error);
  }
});

router.post("/create_user", async (req, res, next) => {
  try {
    const orgId = req.user ? req.user.orgId : null; // Si no hay token, orgId puede ser null
    await Usuario.crearUsuario({ ...req.body, organizacion_id: orgId }, req.dbClient);
    res.json({ success: true, message: "Usuario registrado con éxito" });
  } catch (error) {
    next(error);
  }
});

router.post("/save_user_devides", verifyToken, async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    await Usuario.saveUserDevices({ ...req.body, organizacion_id: orgId }, req.dbClient);
    res.json({ success: true, message: "Dispositivo de usuario guardado con éxito" });
  } catch (error) {
    next(error);
  }
});

router.get("/obtener_nombres", verifyToken, async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const data = await Usuario.obtenerPorCedula(req.query.cedula, orgId, req.dbClient);
    res.json(
      data.length
        ? { success: true, data }
        : { success: false, message: "No se encontró un usuario con la cédula proporcionada" }
    );
  } catch (error) {
    next(error);
  }
});

router.get("/info_user", verifyToken, async (req, res) => {
  try {
    res.json({ success: true, data: req.user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/sign_in", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email y contraseña son requeridos" });
    }

    const token = await autenticarUsuario(email, password, req.dbClient);

    if (token) {
      res.json({ success: true, message: "Inicio de sesión exitoso", token });
    } else {
      res.status(401).json({ success: false, message: "Credenciales incorrectas" });
    }
  } catch (error) {
    next(error);
  }
});

// Middleware para liberar el cliente después de cada solicitud
router.use((req, res, next) => {
  if (req.dbClient) {
    req.dbClient.release();
  }
  next();
});

export default router;
