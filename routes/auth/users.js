import express from "express";
import User from "../../models/User.js";
import { saveDevice } from "../../models/UserDevices.js";
import { getUserInfo } from "../../models/General.js";
import { authenticateUser } from "../../models/Authentication.js";
import { verifyToken } from "../../middleware/auth.js";
import pool from '../../config/db.js'; 

const router = express.Router();

router.use(async (req, res, next) => {
  const client = await pool.connect();
  try {
    if (req.user && req.user.orgId) {
      await client.query('SET app.current_org_id = $1', [req.user.orgId]);
    }
    req.dbClient = client; 
    next();
  } catch (error) {
    client.release(); 
    next(error);
  }
});

router.post("/create-user", async (req, res, next) => {
  try {
    const orgId = req.user ? req.user.orgId : null;
    await User.createUser({ ...req.body, organizacion_id: orgId }, req.dbClient);
    res.json({ success: true, message: "Usuario registrado con éxito" });
  } catch (error) {
    next(error);
  }
});

router.post("/save-user-devices", verifyToken, async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    await saveDevice({ ...req.body, organizacion_id: orgId }, req.dbClient);
    res.json({ success: true, message: "Dispositivo de usuario guardado con éxito" });
  } catch (error) {
    next(error);
  }
});

router.get("/get-names", verifyToken, async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const data = await getUserInfo(req.query.cedula);
    res.json(
      data.length
        ? { success: true, data }
        : { success: false, message: "No se encontró un usuario con la cédula proporcionada" }
    );
  } catch (error) {
    next(error);
  }
});

router.get("/user-info", verifyToken, async (req, res) => {
  try {
    res.json({ success: true, data: req.user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/sign-in", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email y contraseña son requeridos" });
    }

    const token = await authenticateUser(email, password, req.dbClient);

    if (token) {
      res.json({ success: true, message: "Inicio de sesión exitoso", token });
    } else {
      res.status(401).json({ success: false, message: "Credenciales incorrectas" });
    }
  } catch (error) {
    next(error);
  }
});

router.use((req, res, next) => {
  if (req.dbClient) {
    req.dbClient.release();
  }
  next();
});

export default router;