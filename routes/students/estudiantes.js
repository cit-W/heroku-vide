import express from 'express';
import { verifyToken } from '../../middleware/auth.js';
import {
  obtenerPorNombre,
  obtenerPorID,
  agregarEstudiante,
  crearUsuario,
  createTableStudents,
  deleteEstudiantes,
} from '../../models/Estudiante.js';
import pool from '../../config/db.js'; // Importar el pool de conexiones

const router = express.Router();

// Middleware para manejar la conexión y el RLS
router.use(verifyToken, async (req, res, next) => {
  const client = await pool.connect();
  try {
    // Establecer la variable de sesión para RLS
    await client.query('SET app.current_org_id = $1', [req.user.orgId]);
    req.dbClient = client; // Adjuntar el cliente a la solicitud
    next();
  } catch (error) {
    client.release(); // Liberar el cliente en caso de error
    next(error);
  }
});

router.post('/create_user', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    await crearUsuario({ ...req.body, organizacion_id: orgId }, req.dbClient);
    res.json({ success: true, message: 'Usuario registrado con éxito' });
  } catch (error) {
    next(error);
  }
});

router.get('/registro_estudiante_name', async (req, res, next) => {
  const { nombre } = req.query;
  const orgId = req.user.orgId;
  if (!nombre)
    return res
      .status(400)
      .json({ error: 'No se proporcionó un nombre válido' });

  try {
    const data = await obtenerPorNombre(nombre, orgId, req.dbClient);
    res.json(
      data
        ? { success: true, data }
        : { success: false, message: 'No se encontraron registros' }
    );
  } catch (error) {
    next(error);
  }
});

router.get('/registro_estudiante', async (req, res, next) => {
  const { id } = req.query;
  const orgId = req.user.orgId;
  if (!id)
    return res.status(400).json({ error: 'No se proporcionó un ID válido' });

  try {
    const data = await obtenerPorID(id, orgId, req.dbClient);
    res.json(
      data
        ? { success: true, data }
        : { success: false, message: 'No se encontraron registros' }
    );
  } catch (error) {
    next(error);
  }
});

router.post('/delete_students', async (req, res, next) => {
  const { id } = req.query;
  const orgId = req.user.orgId;
  if (!id)
    return res.status(400).json({ error: 'No se proporcionó un ID válido' });

  try {
    await deleteEstudiantes(orgId, req.dbClient);
    res.json({ success: true, message: 'Estudiante eliminado con éxito' });
  } catch (error) {
    next(error);
  }
});

router.post('/uploadStudents', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;

    // Crear tabla dinámica para esa organización
    await createTableStudents(orgId, req.dbClient);

    const students = req.body; // Se espera un arreglo de objetos { name, id, rh, grade }
    if (!Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        message: 'Se esperaba un arreglo de estudiantes',
      });
    }

    // Insertar cada estudiante en la base de datos
    for (const student of students) {
      // Validar campos mínimos
      if (!student.name || !student.id) continue;
      await agregarEstudiante(
        student.name,
        student.id,
        student.rh,
        student.grade,
        orgId,
        req.dbClient
      );
    }

    // Al final, enviar solo una respuesta
    res.json({
      success: true,
      message: 'Estudiantes agregados correctamente',
      orgId,
    });
  } catch (error) {
    next(error); // Deja que el middleware de errores lo maneje
  }
});

// Middleware para liberar el cliente después de cada solicitud
router.use((req, res, next) => {
  if (req.dbClient) {
    req.dbClient.release();
  }
  next();
});

export default router;