import express from 'express';
import {
  obtenerReservas,
  obtenerPorNombre,
  obtenerPorID,
  agregarEstudiante,
} from '../../models/Estudiante.js';
const router = express.Router();

router.get('/registro_reservas', async (req, res) => {
  try {
    const data = await obtenerReservas();
    res.json(
      data
        ? { success: true, data }
        : { success: false, message: 'No se encontraron reservas' }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
});

router.get('/registro_estudiante_name', async (req, res) => {
  const { nombre } = req.query;
  if (!nombre)
    return res
      .status(400)
      .json({ error: 'No se proporcionó un nombre válido' });

  try {
    const data = await obtenerPorNombre(nombre);
    res.json(
      data
        ? { success: true, data }
        : { success: false, message: 'No se encontraron registros' }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el estudiante' });
  }
});

router.get('/registro_estudiante', async (req, res) => {
  const { id } = req.query;
  if (!id)
    return res.status(400).json({ error: 'No se proporcionó un ID válido' });

  try {
    const data = await obtenerPorID(id);
    res.json(
      data
        ? { success: true, data }
        : { success: false, message: 'No se encontraron registros' }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el estudiante' });
  }
});

router.post('/delete_students', async (req, res) => {
  const { id } = req.query;
  if (!id)
    return res.status(400).json({ error: 'No se proporcionó un ID válido' });

  try {
    await deleteEstudiante(id);
    res.json({ success: true, message: 'Estudiante agregado con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al agregar el estudiante' });
  }
});

router.post('/uploadStudents', async (req, res) => {
  try {
    const students = req.body; // Se espera un arreglo de objetos { name, id, rh, grade }
    if (!Array.isArray(students)) {
      return res
        .status(400)
        .json({
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
        student.grade
      );
    }
    res.json({ success: true, message: 'Estudiantes agregados correctamente' });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, error: 'Error al procesar los estudiantes' });
  }
});

export default router;
