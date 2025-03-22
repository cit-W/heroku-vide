import express from "express";
import Reserva from "../../models/Reserva.js";
import Usuario from "../../models/Usuario.js";
const router = express.Router();

// Endpoint para obtener IDs (suponiendo que en Reserva se implemente obtenerIDs que reciba orgID)
router.get("/ids", async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ success: false, data: "Falta email" });
  }
  try {
    const orgData = await Usuario.obtenerOrgId(email);
    if (!orgData || orgData.length === 0) {
      return res.status(404).json({ success: false, data: "Organización no encontrada" });
    }
    const orgId = orgData[0].organizacion_id;
    // Asegúrate de implementar obtenerIDs en Reserva para filtrar por orgID
    const data = await Reserva.obtenerReservasPorOrganizacion(orgId);
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, data: "Error al obtener los IDs" });
  }
});

// Endpoint para obtener una reserva por su ID
router.get("/registro_reservas", async (req, res) => {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ success: false, data: "No se proporcionó un ID válido" });
  }
  try {
    const data = await Reserva.obtenerReservaPorId(id);
    if (data) {
      res.json({ success: true, data });
    } else {
      res.status(404).json({ success: false, data: "Reserva no encontrada" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, data: "Error al obtener la reserva" });
  }
});

// Endpoint para reportar una reserva
router.post("/reportar", async (req, res) => {
  const { profesor, clase, lugar, hora_inicio, hora_final } = req.body;
  const email = req.query.email;
  if (!profesor || !clase || !lugar || !hora_inicio || !hora_final || !email) {
    return res.status(400).json({ success: false, data: "Faltan datos" });
  }
  try {
    const orgData = await Usuario.obtenerOrgId(email);
    if (!orgData || orgData.length === 0) {
      return res.status(404).json({ success: false, data: "Organización no encontrada" });
    }
    const orgId = orgData[0].organizacion_id;
    // Se mapean los parámetros: profesor → name, clase → grade, etc.
    await Reserva.reportarReserva(profesor, clase, lugar, hora_inicio, hora_final, orgId);
    res.json({ success: true, data: "Reporte registrado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, data: "Error al registrar el reporte" });
  }
});

// Endpoint para registrar una reserva
router.post("/reservar_lugar", async (req, res) => {
  const { profesor, clase, lugar, hora_inicio, hora_final } = req.body;
  const email = req.query.email;
  if (!profesor || !clase || !lugar || !hora_inicio || !hora_final || !email) {
    return res.status(400).json({ success: false, data: "Faltan datos" });
  }
  try {
    const orgData = await Usuario.obtenerOrgId(email);
    if (!orgData || orgData.length === 0) {
      return res.status(404).json({ success: false, data: "Organización no encontrada" });
    }
    const orgId = orgData[0].organizacion_id;
    await Reserva.reservarLugar(profesor, clase, lugar, hora_inicio, hora_final, orgId);
    res.json({ success: true, data: "Reserva registrada con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, data: "Error al registrar la reserva" });
  }
});

// Endpoint para eliminar reservas expiradas (no se filtra por organización)
router.post("/eliminarExpiradas", async (req, res) => {
  try {
    const result = await Reserva.eliminarExpiradas();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, data: "Error al eliminar reservas expiradas" });
  }
});

// Endpoint para verificar la disponibilidad de una reserva
router.post("/verificar_reserva", async (req, res) => {
  const { lugar, clase, hora_inicio, hora_final } = req.body;
  const email = req.query.email;
  if (!lugar || !clase || !hora_inicio || !hora_final || !email) {
    return res.status(400).json({ success: false, data: "Faltan datos" });
  }
  try {
    const orgData = await Usuario.obtenerOrgId(email);
    if (!orgData || orgData.length === 0) {
      return res.status(404).json({ success: false, data: "Organización no encontrada" });
    }
    const orgId = orgData[0].organizacion_id;
    const result = await Reserva.verificarDisponibilidad(lugar, clase, hora_inicio, hora_final, orgId);
    // La propiedad "disponible" en el resultado indica si se encontró conflicto o no
    res.json({ success: result.disponible, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, data: "Error en la verificación de disponibilidad" });
  }
});

export default router;