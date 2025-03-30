import pool from "../config/db.js";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

export async function verificarConexion() {
        const query = "SELECT * FROM android_mysql.usuarios";
        const { rows } = await pool.query(query);
        return rows;
}

export async function obtenerInfoUsuario(email) {
  try {
    // Intenta leer del caché de usuarios y estudiantes
    let usuarios = cache.get('usuarios') || [];
    let usuariosEstudiantes = cache.get('usuariosEstudiantes') || [];

    // Buscar en caché primero
    let usuario = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase()) ||
                  usuariosEstudiantes.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (usuario) {
      return usuario; // Devuelve si está en caché
    }

    // Si no está en caché, buscar en la BD (usuarios primero)
    const queryUsuarios = `
      SELECT personal_id, name, email, role, departamento, escuela, curso
      FROM users
      WHERE email = $1
    `;
    const { rows: userRows } = await pool.query(queryUsuarios, [email]);

    if (userRows.length > 0) {
      usuario = userRows[0];

      // Guardar en caché de usuarios
      usuarios.push(usuario);
      cache.set('usuarios', usuarios);

      return usuario;
    }

    // Si no está en users, buscar en studentUser
    const queryEstudiantes = `
      SELECT personal_id, name, email, role, NULL AS departamento, NULL AS escuela, grade AS curso
      FROM studentUser
      WHERE email = $1
    `;
    const { rows: studentRows } = await pool.query(queryEstudiantes, [email]);

    if (studentRows.length > 0) {
      usuario = studentRows[0];

      // Guardar en caché de estudiantes
      usuariosEstudiantes.push(usuario);
      cache.set('usuariosEstudiantes', usuariosEstudiantes);
    }

    return usuario ?? null;
  } catch (error) {
    console.error('Error en obtenerInfoUsuario:', error);
    throw new Error('Error interno al obtener información de usuario');
  }
}