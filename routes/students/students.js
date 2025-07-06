import express from 'express';
import { verifyToken } from '../../middleware/auth.js';
import {
  getStudentByName,
  getStudentById,
  addStudent,
  upsertStudentUser,
  deleteStudentsByOrganization,
} from '../../models/Student.js';
import pool from '../../config/db.js';

const router = express.Router();


router.use(verifyToken, async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('SET app.current_org_id = $1', [req.user.orgId]);
    req.dbClient = client;
    next();
  } catch (error) {
    client.release();
    next(error);
  }
});

router.post('/create-student-user', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    await upsertStudentUser({ ...req.body, organizacion_id: orgId }, req.dbClient);
    res.json({ success: true, message: 'Usuario registrado con éxito' });
  } catch (error) {
    next(error);
  }
});

router.get('/get-student-record-by-name', async (req, res, next) => {
  const { nombre } = req.query;
  const orgId = req.user.orgId;
  if (!nombre) return res.status(400).json({ error: 'No se proporcionó un nombre válido' });

  try {
    const data = await getStudentByName(nombre, orgId, req.dbClient);
    res.json(data ? { success: true, data } : { success: false, message: 'No se encontraron registros' });
  } catch (error) {
    next(error);
  }
});

router.get('/get-student-record-by-id', async (req, res, next) => {
  const { id } = req.query;
  const orgId = req.user.orgId;
  if (!id) return res.status(400).json({ error: 'No se proporcionó un ID válido' });

  try {
    const data = await getStudentById(id, orgId, req.dbClient);
    res.json(data ? { success: true, data } : { success: false, message: 'No se encontraron registros' });
  } catch (error) {
    next(error);
  }
});

router.post('/delete-students', async (req, res, next) => {
  const orgId = req.user.orgId;
  try {
    await deleteStudentsByOrganization(orgId, req.dbClient);
    res.json({ success: true, message: 'Estudiantes eliminados con éxito' });
  } catch (error) {
    next(error);
  }
});

router.post('/upload-students', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const students = req.body;

    if (!Array.isArray(students)) {
      return res.status(400).json({ success: false, message: 'Se esperaba un arreglo de estudiantes' });
    }

    for (const student of students) {
      if (!student.name || !student.id) continue;
      await addStudent({ ...student, organizacion_id: orgId }, req.dbClient);
    }

    res.json({ success: true, message: 'Estudiantes agregados correctamente', orgId });
  } catch (error) {
    next(error);
  }
});


router.use((req, res, next) => {
  if (req.dbClient) {
    req.dbClient.release();
  }
  next();
});

export default router;
