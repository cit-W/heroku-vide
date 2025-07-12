import express from 'express';
import axios from 'axios';
import pool from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// NOTA: Esta función es un EJEMPLO. Las consultas SQL aquí deben ser
// actualizadas a medida que implementes las funcionalidades del archivo TODO.
async function getStudentProfileForAI(studentId, orgId) {
    const client = await pool.connect();
    try {
        // Ejemplo de consulta de datos del estudiante
        const studentQuery = 'SELECT u.nombre, g.nombre as grado FROM usuarios u JOIN grados g ON u.grado_id = g.id WHERE u.id = $1 AND u.organizacion_id = $2';
        const studentRes = await client.query(studentQuery, [studentId, orgId]);
        if (studentRes.rows.length === 0) return null;

        // Ejemplo de consulta de citaciones
        const citationsQuery = `
            SELECT
                COUNT(*) FILTER (WHERE tipo = 'Negativa') as citaciones_negativas,
                COUNT(*) FILTER (WHERE tipo = 'Positiva') as citaciones_positivas
            FROM citaciones WHERE student_id = $1 AND organizacion_id = $2;
        `;
        const citationsRes = await client.query(citationsQuery, [studentId, orgId]);
        
        // Ejemplo de consulta de asistencia (requiere implementar el módulo)
        const attendanceQuery = 'SELECT COUNT(*) as ausencias FROM asistencia WHERE student_id = $1 AND organizacion_id = $2';
        const attendanceRes = await client.query(attendanceQuery, [studentId, orgId]);

        // Ejemplo de consulta de observaciones (requiere implementar el módulo)
        const observationsQuery = 'SELECT comentario, fecha FROM observaciones WHERE student_id = $1 AND organizacion_id = $2 ORDER BY fecha DESC LIMIT 5';
        const observationsRes = await client.query(observationsQuery, [studentId, orgId]);


        return {
            student_info: studentRes.rows[0] || {},
            attendance_summary: attendanceRes.rows[0] || {},
            incidents_summary: citationsRes.rows[0] || {},
            recent_observations: observationsRes.rows || [],
        };
    } catch(e) {
        console.error("Error en getStudentProfileForAI:", e.message);
        // Devolvemos un objeto vacío para no romper el flujo, pero logueamos el error.
        return {};
    }
    finally {
        client.release();
    }
}


router.post('/ask', verifyToken, async (req, res, next) => {
    const { studentId, query } = req.body;
    const orgId = req.user.orgId;

    if (!studentId || !query) {
        return res.status(400).json({ success: false, message: 'Se requiere studentId y una consulta (query).' });
    }

    try {
        const studentProfile = await getStudentProfileForAI(studentId, orgId);

        if (!studentProfile) {
            return res.status(404).json({ success: false, message: 'Estudiante no encontrado en esta organización.' });
        }

        const aiServiceUrl = 'http://127.0.0.1:8000/generate-counselor-response';
        
        const aiResponse = await axios.post(aiServiceUrl, {
            student_data: studentProfile,
            user_query: query
        });

        res.json({ success: true, response: aiResponse.data.response });

    } catch (error) {
        console.error("Error al contactar el servicio de IA:", error.message);
        res.status(500).json({ success: false, message: 'No se pudo obtener una respuesta del Consejero AI.' });
        next(error);
    }
});

export default router;
