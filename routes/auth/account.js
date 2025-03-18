const express = require("express");
const Account = require("../../models/Account");
const router = express.Router();

router.delete("/delete_reserva_personal/:id", async (req, res) => {
  try {
    const success = await Account.eliminarReservaPersonal(req.params.id);
    res.json(success ? { success: true, message: "Borrado exitosamente" } : { success: false, error: "Error al borrar o el ID no existe" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al eliminar la reserva" });
  }
});

router.delete("/delete_social_personal", async (req, res) => {
  try {
    const success = await Account.eliminarTrabajoSocialPersonal(req.query.id);
    res.json(success ? { success: true, message: "Borrado exitosamente" } : { success: false, error: "Error al borrar o el ID no existe" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al eliminar el trabajo social" });
  }
});

router.get("/reservasIDs_personal", async (req, res) => {
  try {
    const data = await Account.obtenerReservasPorProfesor(req.query.profesor);
    res.json(data.length ? { success: true, data } : { success: false, message: "No se encontraron reservas para el profesor proporcionado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al obtener reservas" });
  }
});

router.get("/socialIDs_personal", async (req, res) => {
  try {
    const data = await Account.obtenerTrabajosSocialesPorProfesor(req.query.profesor);
    res.json(data.length ? { success: true, data } : { success: false, message: "No se encontraron trabajos sociales para el profesor proporcionado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al obtener trabajos sociales" });
  }
});

module.exports = router;