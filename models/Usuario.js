const pool = require("../config/db");
const bcrypt = require("bcrypt");
const saltRounds = 10; // Número de iteraciones para generar la sal

const Usuario = {
    async crearUsuario({ personal_id, name, email, password, organizacion_id, role, departamento, escuela, curso }) {
        // Hasheamos la contraseña de forma asíncrona
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const query = `
        INSERT INTO users (personal_id, name, email, password, organizacion_id, role, departamento, escuela, curso)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (personal_id) DO UPDATE 
        SET name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role, departamento = EXCLUDED.departamento, 
            escuela = EXCLUDED.escuela, curso = EXCLUDED.curso;
        `;
        // Utilizamos el hash de la contraseña en lugar del password en texto claro
        await pool.query(query, [personal_id, name, email, hashedPassword, organizacion_id, role, departamento, escuela, curso]);
    },

    async obtenerUsuariosPorOrganizacion(organizacion_id) {
        const query = "SELECT * FROM users WHERE organizacion_id = $1 ORDER BY name";
        const { rows } = await pool.query(query, [organizacion_id]);
        return rows;
    },

    async autenticarUsuario(email, password) {
        const query = "SELECT password FROM users WHERE email = $1";
        const { rows } = await pool.query(query, [email]);

        if (rows.length === 0) {
            return false; // Usuario no encontrado
        }

        const hashedPassword = rows[0].password;
        const isMatch = await bcrypt.compare(password, hashedPassword);
        return isMatch;
    }
};

module.exports = Usuario;