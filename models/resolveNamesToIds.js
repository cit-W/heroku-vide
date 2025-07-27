import pool from '../config/db.js';





export async function resolveNamesToIds(
  { organizacion_id, place, roles, departments },
  client = pool
) {
  if (!organizacion_id) throw new Error('❌ Se requiere el organizacion_id');

  const resultados = {};

  try {
    

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

export default resolveNamesToIds;
