const pool = require("../config/db");
const NodeCache = require("node-cache");

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

const General = {
    async verificarConexion() {
        const query = "SELECT * FROM android_mysql.usuarios";
        const { rows } = await pool.query(query);
        return rows;
    },

    async obtenerInfoUsuario(id) {
        let usuarios = cache.get("usuarios");
        if (!usuarios) {
        const query = "SELECT * FROM android_mysql.usuarios";
        const dbResult = await pool.query(query);
        usuarios = dbResult.rows;
        cache.set("usuarios", usuarios);
        }
        return usuarios.filter((user) => user.cedula === id);
    },
};

module.exports = General;