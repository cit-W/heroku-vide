import express from "express";
import {registerUser, sendNotification} from "../models/Notification.js";
const router = express.Router();

router.post("/register-user", async (req, res) => {
  try {
    const { player_id, user_id, role } = req.body;
    if (!player_id || !user_id || !role) {
      return res.status(400).json({ error: "Faltan datos (player_id, user_id, role)" });
    }
    await registerUser(user_id, player_id, role);
    res.json({ success: true, message: "Usuario registrado y tag asignado correctamente." });
  } catch (error) {
    console.error("Error al registrar usuario:", error.message);
    res.status(500).json({ error: "Error al registrar el usuario." });
  }
});

router.post("/send-notification", async (req, res) => {
  try {
    const { title, body, role, departamento, nivel } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: "Faltan datos (title, body)" });
    }
    const response = await sendNotification(title, body, role, departamento, nivel);
    res.json({ success: true, message: "Notificación enviada correctamente", data: response.data });
  } catch (error) {
    console.error("Error al enviar notificación:", error.message);
    res.status(500).json({ error: "Error al enviar la notificación." });
  }
});

export default router;