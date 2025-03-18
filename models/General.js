const pool = require("../config/db");
const NodeCache = require("node-cache");

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

const General = {
    async verificarConexion() {
        const query = "SELECT * FROM android_mysql.usuarios";
        const { rows } = await pool.query(query);
        return rows;
    },

    async obtenerInfoUsuario(email) {
        let usuarios = cache.get("usuarios");
        
        if (!usuarios) {
            // Consulta SQL que excluye password y org_id
            const query = `SELECT personal_id, name, email, role, departamento, escuela, curso
                            FROM users`;
            
            try {
                const dbResult = await pool.query(query);
                usuarios = dbResult.rows;
                cache.set("usuarios", usuarios); // Almacena en caché
            } catch (error) {
                console.error("Error al obtener usuarios:", error);
                throw new Error("Error en la consulta de usuarios");
            }
        }
        
        // Filtra el usuario por personal_id, convirtiendo ambos a string para comparación
        const usuario = usuarios.find((user) => String(user.email) === String(email));
        
        if (!usuario) {
            return null;
        }
        
        return usuario;
    }
};

module.exports = General;