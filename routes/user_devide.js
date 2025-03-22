import express from "express";
import pool from ".././config/db.js";
import {postDevice, getDevice} from "../models/UserDevices.js";

const router = express.Router();

router.post("/", async (req, res) => {
    const { email, player_id, device_type } = req.body;
    
    if (!email || !player_id || !device_type) {
        return res.status(400).json({ success: false, error: "Faltan datos requeridos." });
    }

    try {
        const result = await postDevice(email, player_id, device_type)
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Error al registrar el dispositivo." });
    }
});

router.get("/", async (req, res) => {
    const { email } = req.query;

    try {
        const result = await getDevice(email)
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Error al obtener dispositivos." });
    }
});

router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { device_type, last_active } = req.body;

    if (!device_type && !last_active) {
        return res.status(400).json({ success: false, error: "No se proporcionó ningún dato para actualizar." });
    }

    try {
        let fields = [];
        let values = [];
        let index = 1;

        if (device_type) {
        fields.push(`device_type = $${index}`);
        values.push(device_type);
        index++;
        }
        if (last_active) {
        fields.push(`last_active = $${index}`);
        values.push(last_active);
        index++;
        }
        values.push(id);

        const result = await pool.query(
        `UPDATE user_devices SET ${fields.join(", ")} WHERE id = $${index} RETURNING *;`,
        values
        );

        if (result.rowCount === 0) {
        return res.status(404).json({ success: false, error: "Dispositivo no encontrado." });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Error al actualizar el dispositivo." });
    }
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query("DELETE FROM user_devices WHERE id = $1;", [id]);
        if (result.rowCount === 0) {
        return res.status(404).json({ success: false, error: "Dispositivo no encontrado." });
        }
        res.json({ success: true, message: "Dispositivo eliminado correctamente." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Error al eliminar el dispositivo." });
    }
});

export default router;