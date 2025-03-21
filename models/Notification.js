import pool from "../config/db.js";
import axios from "axios";

const ONE_SIGNAL_APP_ID = process.env.ONE_SIGNAL_APP_ID;
const ONE_SIGNAL_API_KEY = process.env.ONE_SIGNAL_API_KEY;

export async function registerUser(user_id, player_id, role) {
        const query = `
        INSERT INTO android_mysql.users (user_id, player_id, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id)
        DO UPDATE SET player_id = EXCLUDED.player_id, role = EXCLUDED.role;
        `;
        await pool.query(query, [user_id, player_id, role]);

        await axios.post(
        `https://onesignal.com/api/v1/players/${player_id}/on_session`,
        {
            app_id: ONE_SIGNAL_APP_ID,
            tags: { role: role }
        },
        {
            headers: {
            Authorization: `Basic ${ONE_SIGNAL_API_KEY}`,
            "Content-Type": "application/json"
            }
        }
        );
    }

export async function sendNotification(title, body, role, departamento, nivel) {
        let filters = [];
        const addTagFilter = (key, value) => {
        if (filters.length > 0) filters.push({ operator: "AND" });
        filters.push({ field: "tag", key, relation: "=", value });
        };
        if (role) addTagFilter("role", role);
        if (departamento) addTagFilter("departamento", departamento);
        if (nivel) addTagFilter("nivel", nivel);

        return await axios.post(
        "https://onesignal.com/api/v1/notifications",
        {
            app_id: ONE_SIGNAL_APP_ID,
            filters: filters.length > 0 ? filters : undefined,
            contents: { en: body, es: body },
            headings: { en: title, es: title },
            android_channel_id: "5fc000b3-506f-4dd6-8f97-88e0f3b0c9c7",
            priority: "high",
            visibility: 1
        },
        {
            headers: {
            Authorization: `Basic ${ONE_SIGNAL_API_KEY}`,
            "Content-Type": "application/json"
            }
        }
        );
}