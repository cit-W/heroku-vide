import pool from '../config/db.js';

/**
 * Busca los IDs correspondientes a los nombres dados, según la organización.
 *
 * @param {Object} opciones - Opciones de búsqueda
 * @param {string} opciones.organizacion_id - ID de la organización (obligatorio)
 * @param {string} [opciones.grade] - Nombre del grado (opcional)
 * @param {string} [opciones.place] - Nombre del lugar (opcional)
 * @param {string} [opciones.roles] - Nombre del rol (opcional)
 * @param {string} [opciones.education_levels] - Nivel educativo (opcional)
 * @param {string} [opciones.departments] - Nombre del departamento (opcional)
 * @param {object} [client=pool] - Cliente de conexión a la base de datos (opcional, por defecto usa el pool)
 * @returns {Object} - Objeto con los IDs encontrados
 */

export async function buscarIdsPorNombres(
  { organizacion_id, grade, place, roles, education_levels, departments },
  client = pool
) {
  if (!organizacion_id) throw new Error('❌ Se requiere el organizacion_id');

  const resultados = {};

  try {
    if (grade) {
      const res = await client.query(
        `SELECT id FROM grades WHERE grade = $1 AND organizacion_id = $2`,
        [grade, organizacion_id]
      );
      if (res.rowCount === 0)
        throw new Error(`❌ Grado "${grade}" no encontrado.`);
      resultados.grade_id = res.rows[0].id;
    }

    if (place) {
      const res = await client.query(
        `SELECT id FROM places WHERE place = $1 AND organizacion_id = $2`,
        [place, organizacion_id]
      );
      if (res.rowCount === 0)
        throw new Error(`❌ Lugar "${place}" no encontrado.`);
      resultados.place_id = res.rows[0].id;
    }

    if (roles) {
      const res = await client.query(
        `SELECT id FROM roles WHERE role = $1 AND organizacion_id = $2`,
        [roles, organizacion_id]
      );
      if (res.rowCount === 0)
        throw new Error(`❌ Rol "${roles}" no encontrado.`);
      resultados.role_id = res.rows[0].id;
    }

    if (education_levels) {
      const res = await client.query(
        `SELECT id FROM education_levels WHERE level = $1 AND organizacion_id = $2`,
        [education_levels, organizacion_id]
      );
      if (res.rowCount === 0)
        throw new Error(
          `❌ Nivel educativo "${education_levels}" no encontrado.`
        );
      resultados.education_levels_id = res.rows[0].id;
    }

    if (departments) {
      const res = await client.query(
        `SELECT id FROM departments WHERE department = $1 AND organizacion_id = $2`,
        [departments, organizacion_id]
      );
      if (res.rowCount === 0)
        throw new Error(`❌ Departamento "${departments}" no encontrado.`);
      resultados.department_id = res.rows[0].id;
    }

    return resultados;
  } catch (error) {
    console.error('❌ Error al buscar IDs:', error.message);
    throw error;
  }
}

export default buscarIdsPorNombres;