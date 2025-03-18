const express = require("express");
const Reserva = require("../../models/Reserva");
const router = express.Router();

router.get("/ids", async (req, res) => {
  try {
    const data = await Reserva.obtenerIDs();
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los IDs" });
  }
});

router.get("/registro_reservas", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "No se proporcionó un ID válido" });
  try {
    const data = await Reserva.obtenerPorID(id);
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener la reserva" });
  }
});

router.post("/reportar", async (req, res) => {
  const { profesor, clase, lugar, hora_inicio, hora_final } = req.body;
  if (!profesor || !clase || !lugar || !hora_inicio || !hora_final) {
    return res.status(400).json({ error: "Faltan datos" });
  }
  try {
    await Reserva.reportarReserva(profesor, clase, lugar, hora_inicio, hora_final);
    res.json({ success: true, message: "Reporte registrado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar el reporte" });
  }
});

router.post("/reservar_lugar", async (req, res) => {
  const { profesor, clase, lugar, hora_inicio, hora_final } = req.body;
  if (!profesor || !clase || !lugar || !hora_inicio || !hora_final) {
    return res.status(400).json({ error: "Faltan datos" });
  }
  try {
    await Reserva.reservarLugar(profesor, clase, lugar, hora_inicio, hora_final);
    res.json({ success: true, message: "Reserva registrada con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar la reserva" });
  }
});

router.post("/eliminarExpiradas", async (req, res) => {
  try {
    const result = await Reserva.eliminarExpiradas();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar reservas expiradas" });
  }
});

router.post("/verificar_reserva", async (req, res) => {
  const { lugar, clase, hora_inicio, hora_final } = req.body;
  if (!lugar || !clase || !hora_inicio || !hora_final) {
    return res.status(400).json({ error: "Faltan datos" });
  }
  try {
    const result = await Reserva.verificarDisponibilidad(lugar, clase, hora_inicio, hora_final);
    res.json({ success: result.disponible, ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en la verificación de disponibilidad" });
  }
});

module.exports = router;