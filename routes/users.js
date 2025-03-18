const express = require("express");
const Reserva = require("../models/Reserva");
const router = express.Router();

router.get("/ids", async (req, res) => {
  try {
    const data = await Reserva.obtenerIDs();
    res.json(data ? { success: true, data } : { success: false, message: "No se encontraron IDs" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los IDs" });
  }
});

router.get("/registro_reservas", async (req, res) => {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "No se proporcionó un ID válido" });
  }

  try {
    const data = await Reserva.obtenerReservasPorID(id);
    res.json(data ? { success: true, data } : { success: false, message: "No se encontraron reservas" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener las reservas" });
  }
});

router.post("/reportar", async (req, res) => {
  const { profesor, clase, lugar, hora_inicio, hora_final } = req.query;
  if (!profesor || !clase || !lugar || !hora_inicio || !hora_final) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    await Reserva.reportarReserva(profesor, clase, lugar, hora_inicio, hora_final);
    res.json({ message: "Reporte registrado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar el reporte" });
  }
});

router.post("/reservar_lugar", async (req, res) => {
  const { profesor, clase, lugar, hora_inicio, hora_final } = req.query;
  if (!profesor || !clase || !lugar || !hora_inicio || !hora_final) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    await Reserva.reservarLugar(profesor, clase, lugar, hora_inicio, hora_final);
    res.json({ message: "Reserva registrada con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar la reserva" });
  }
});

module.exports = router;