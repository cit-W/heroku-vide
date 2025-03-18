const express = require("express");
const Citacion = require("../../models/Citacion");
const router = express.Router();

router.post("/create_citation", async (req, res) => {
    try {
        await Citacion.crearCita(req.query);
        res.json({ success: true, message: "Citación creada con éxito" });
    } catch (error) {
        console.error("Error al crear la citación: ", error);
        res.status(500).json({ error: "Error al crear la citación" });
    }
    });

    router.get("/get_citations", async (req, res) => {
    try {
        const { person, status } = req.query;
        if (!person || !status) return res.status(400).json({ error: "Faltan parámetros" });

        const data = await Citacion.obtenerCitas(person, status);
        res.json(data.length ? { success: true, data } : { success: false, message: "No hay citas" });
    } catch (error) {
        console.error("Error al obtener citas: ", error);
        res.status(500).json({ error: "Error al obtener citas" });
    }
    });

    router.put("/update_citation", async (req, res) => {
    try {
        await Citacion.actualizarCita(req.query);
        res.json({ success: true, message: "Citación actualizada" });
    } catch (error) {
        console.error("Error al actualizar la citación: ", error);
        res.status(500).json({ error: "Error al actualizar la citación" });
    }
    });

    router.get("/ids_citaciones", async (req, res) => {
    try {
        const data = await Citacion.obtenerTablas();
        res.json(data.length ? { success: true, data } : { success: false, message: "No hay tablas disponibles" });
    } catch (error) {
        console.error("Error al obtener las tablas: ", error);
        res.status(500).json({ error: "Error al obtener las tablas" });
    }
});

module.exports = router;