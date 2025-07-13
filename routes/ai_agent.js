import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { availableTools } from '../ai/tools.js';

// --- Tus modelos de base de datos ---
import Reservation from '../models/Reserva.js';
import { addSocialWork } from '../models/TrabajoSocial.js';
import { getPlacesByOrganization } from '../models/Espacio.js';
import { getGradesByOrganization } from '../models/Grado.js';
import { createEvent } from '../models/Cronograma.js';
import { verifyToken } from '../middleware/auth.js';
import Attendance from '../models/Asistencia.js';
import { getStudentInfoByName } from '../models/Student.js';
import { sendNotificationByRole } from '../models/Notification.js';
import { createAppointment } from '../models/Citacion.js';
import { findStudentInGradeFuzzy, fuzzySearch } from '../models/Rastrear.js';

const router = express.Router();

router.post('/execute', verifyToken, async (req, res, next) => {
  // 1. OBTENER DATOS DE LA SOLICITUD, INCLUYENDO EL HISTORIAL Y LA HORA DEL CLIENTE
  const { query, clientTimestamp, history } = req.body;
  const { orgId, userId, role } = req.user; // Obtenemos info del usuario autenticado

  if (!query) {
    return res
      .status(400)
      .json({ success: false, message: 'Se requiere una consulta (query).' });
  }

  // 2. CREAR LA INSTRUCCIÓN DEL SISTEMA DINÁMICAMENTE
  // Usamos la hora del cliente si existe, si no, la del servidor como respaldo.
  const referenceTime = clientTimestamp || new Date().toISOString();
  const systemInstruction = `
    Eres un asistente virtual experto para una institución educativa.
    Tu objetivo es ayudar a los usuarios a gestionar reservas, eventos y otras tareas administrativas.
    La fecha y hora actual exacta del usuario es: ${referenceTime}.
    Cuando un usuario menciona una fecha u hora relativa (como 'hoy a las 5pm', 'mañana', 'en 2 horas'),
    debes usar esta fecha y hora como referencia absoluta para calcular la fecha y hora exacta en formato ISO 8601 que requieren las herramientas.
  `;

  try {
    // 3. INICIALIZAR EL MODELO CON LA CONFIGURACIÓN DINÁMICA
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction,
      tools: [{ functionDeclarations: Object.values(availableTools) }],
    });

    // 4. INICIAR EL CHAT CON EL HISTORIAL PROPORCIONADO POR EL CLIENTE
    const chat = model.startChat({
      history: history || [], // Usamos el historial del cliente, o un arreglo vacío si es la primera solicitud
    });

    // 5. ENVIAR EL NUEVO MENSAJE DEL USUARIO A LA IA
    const result = await chat.sendMessage(query);
    const calls = result.response?.candidates?.[0]?.content?.parts;

    // --- MANEJO DE LA RESPUESTA DE LA IA ---

    // CASO A: La IA respondió con texto, sin llamar a una función.
    if (!calls || !calls.some((part) => part.functionCall)) {
      const responseText =
        result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
      const finalResponse =
        responseText ||
        'Lo siento, no pude procesar tu solicitud. Por favor, intenta de nuevo.';
      const updatedHistory = await chat.getHistory();

      return res.json({
        success: true,
        response: finalResponse,
        history: updatedHistory, // Devolvemos el historial actualizado
      });
    }

    // CASO B: La IA solicitó llamar a una o más funciones.
    const functionResponses = [];

    // Iteramos sobre todas las funciones que la IA quiere llamar
    for (const call of calls) {
      if (call.functionCall) {
        const { name, args } = call.functionCall;
        let functionResponseContent;

        // Ejecutamos la lógica de negocio correspondiente
        switch (name) {
          case 'create_reservation':
            try {
              await Reservation.bookPlace(
                userId,
                args.clase,
                args.lugar,
                args.hora_inicio,
                args.hora_final,
                orgId
              );
              functionResponseContent = `Reserva para '${args.clase}' en '${args.lugar}' creada exitosamente.`;
            } catch (error) {
              if (error.status === 409) {
                functionResponseContent = error.message;
              } else {
                throw error; // Re-lanzar otros errores
              }
            }
            break;
          case 'create_event':
            await createEvent(
              args.tema,
              args.acargo,
              null,
              null,
              args.fecha,
              args.descripcion,
              args.lugar,
              orgId
            );
            functionResponseContent = `Evento '${args.tema}' programado exitosamente.`;
            break;
          case 'create_social_work':
            const { name: studentName, description, hours, date } = args;
            const foundUsers = await fuzzySearch(studentName, orgId);

            if (!foundUsers || foundUsers.length === 0) {
              functionResponseContent = `No se encontró ningún usuario con el nombre '${studentName}'. Por favor, verifica el nombre.`;
            } else if (foundUsers.length > 1) {
              const userNames = foundUsers.map(u => u.name).join(', ');
              functionResponseContent = `Se encontraron varios usuarios con el nombre '${studentName}': ${userNames}. Por favor, sé más específico.`;
            } else {
              const user = foundUsers[0];
              await addSocialWork(
                user.id,
                description,
                hours,
                date,
                orgId
              );
              functionResponseContent = `Se han registrado ${hours} horas de trabajo social para ${user.name}.`;
            }
            break;
          case 'get_places':
            const places = await getPlacesByOrganization(orgId);
            functionResponseContent =
              places && places.length > 0
                ? places
                : 'No se encontraron espacios disponibles.';
            break;
          case 'get_grades':
            const grades = await getGradesByOrganization(orgId);
            functionResponseContent =
              grades && grades.length > 0
                ? grades
                : 'No se encontraron grados disponibles.';
            break;
          case 'consultar_asistencia':
            const attendance = await Attendance.getAttendanceByStudentName(
              args.nombre_estudiante,
              args.fecha || new Date().toISOString().split('T')[0], // Default to today
              orgId
            );
            functionResponseContent = attendance.length > 0 ? attendance : 'No se encontró registro de asistencia para el estudiante en la fecha especificada.';
            break;
          case 'obtener_info_estudiante':
            const studentInfo = await getStudentInfoByName(args.nombre_estudiante, orgId);
            functionResponseContent = studentInfo || 'No se encontró información para el estudiante especificado.';
            break;
          case 'enviar_notificacion_por_rol':
            await sendNotificationByRole(args.rol, args.mensaje, orgId);
            functionResponseContent = `Notificación enviada exitosamente al rol '${args.rol}'.`;
            break;
          case 'crear_citacion':
            const { nombre_estudiante, nombre_grado, motivo, fecha_hora } = args;
            let foundStudents;

            if (nombre_grado) {
              foundStudents = await findStudentInGradeFuzzy(
                nombre_estudiante,
                nombre_grado,
                orgId
              );
            } else {
              foundStudents = await fuzzySearch(nombre_estudiante, orgId);
            }

            if (!foundStudents || foundStudents.length === 0) {
              functionResponseContent = `No se encontró ningún estudiante con el nombre '${nombre_estudiante}'${nombre_grado ? ` en el grado '${nombre_grado}'` : ''}. Por favor, verifica el nombre o el grado.`;
            } else if (foundStudents.length > 1) {
              const studentNames = foundStudents.map(s => s.name).join(', ');
              functionResponseContent = `Se encontraron varios estudiantes con el nombre '${nombre_estudiante}'${nombre_grado ? ` en el grado '${nombre_grado}'` : ''}: ${studentNames}. Por favor, sé más específico.`;
            } else {
              // Exactly one student found
              const student = foundStudents[0];
              await createAppointment({
                topic: motivo,
                tutor: null, // You might want to add a way to specify the tutor
                student_id: student.id,
                name: student.name,
                date: new Date(fecha_hora).toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
                notes: 'Citación creada por IA',
                organizacion_id: orgId,
              });
              functionResponseContent = `Citación para '${student.name}' creada exitosamente.`;
            }
            break;
          case 'buscar_estudiante_en_grado':
            const studentsInGrade = await findStudentInGradeFuzzy(
              args.texto_busqueda,
              args.nombre_grado,
              orgId
            );
            functionResponseContent = studentsInGrade.length > 0 ? studentsInGrade : 'No se encontraron estudiantes con ese nombre en el grado especificado.';
            break;
          case 'buscar_estudiante_general':
            const allStudents = await fuzzySearch(args.texto_busqueda, orgId);
            functionResponseContent = allStudents.length > 0 ? allStudents : 'No se encontraron estudiantes con ese nombre en la organización.';
            break;
          case 'consultar_trabajo_social_por_estado':
            const socialWorks = await getSocialWorksByStatus(args.estado, orgId);
            functionResponseContent = socialWorks.length > 0 ? socialWorks : `No se encontraron trabajos sociales con estado '${args.estado}'.`;
            break;
          default:
            return res
              .status(400)
              .json({
                success: false,
                message: `Función desconocida: ${name}`,
              });
        }

        // Guardamos el resultado de esta función específica para devolverlo a la IA
        functionResponses.push({
          functionResponse: {
            name,
            response: { success: true, content: functionResponseContent },
          },
        });
      }
    }

    // 6. ENVIAR LOS RESULTADOS DE LAS FUNCIONES DE VUELTA A LA IA PARA QUE GENERE LA RESPUESTA FINAL
    const finalResult = await chat.sendMessage(functionResponses);
    const finalResponseText = finalResult.response.text();

    // 7. OBTENER Y DEVOLVER EL HISTORIAL FINAL Y LA RESPUESTA
    const updatedHistory = await chat.getHistory();

    res.json({
      success: true,
      response: finalResponseText,
      history: updatedHistory, // Devolvemos el historial completo para el siguiente turno
    });
  } catch (error) {
    console.error('Error en el agente de IA:', error);
    next(error);
  }
});

export default router;
