import express from "express";
import pool from ".././config/db.js";

const router = express.Router();

export async function postDevice(email, player_id, device_type) {
    const query = `INSERT INTO user_devices (email, player_id, device_type)
        VALUES ($1, $2, $3) RETURNING *;`
        await pool(query, [email, player_id, device_type]);
}

export async function getDevice(email) {
    const query = `SELECT * FROM user_devices WHERE email = $1`
        await pool(query, [email]);
}

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
