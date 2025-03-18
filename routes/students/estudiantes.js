const express = require("express");
const Estudiante = require("../../models/Estudiante");
const router = express.Router();

router.get("/registro_reservas", async (req, res) => {
  try {
    const data = await Estudiante.obtenerReservas();
    res.json(data ? { success: true, data } : { success: false, message: "No se encontraron reservas" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener reservas" });
  }
});

router.get("/registro_estudiante_name", async (req, res) => {
  const { nombre } = req.query;
  if (!nombre) return res.status(400).json({ error: "No se proporcionó un nombre válido" });

  try {
    const data = await Estudiante.obtenerPorNombre(nombre);
    res.json(data ? { success: true, data } : { success: false, message: "No se encontraron registros" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el estudiante" });
  }
});

router.get("/registro_estudiante", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "No se proporcionó un ID válido" });

  try {
    const data = await Estudiante.obtenerPorID(id);
    res.json(data ? { success: true, data } : { success: false, message: "No se encontraron registros" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el estudiante" });
  }
});

router.post("/add_student", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "No se proporcionó un ID válido" });

  try {
    await Estudiante.agregarEstudiante(id);
    res.json({ success: true, message: "Estudiante agregado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al agregar el estudiante" });
  }
});

module.exports = router;