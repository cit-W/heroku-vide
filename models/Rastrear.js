import pool from "../config/db.js";
import NodeCache from "node-cache";
import Fuse from "fuse.js";

// Inicializar el caché
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

export async function obtenerNombres() {
        let result = cache.get("nombres");
        if (!result) {
        const query = "SELECT * FROM android_mysql.id2024sql";
        const dbResult = await pool.query(query);
        result = dbResult.rows;
        cache.set("nombres", result);
        }
        return result;
    }

export async function fuzzySearch(search) {
        let result = await this.obtenerNombres();
        if (result.length > 0) {
        const fuseOptions = {
            includeScore: true,
            threshold: 0.4,
            keys: ["nombre"],
        };
        const fuse = new Fuse(result, fuseOptions);
        const searchResults = fuse.search(search);
        return searchResults.map((r) => r.item);
        }
        return [];
    }