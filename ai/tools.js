// Aquí definimos las "herramientas" que nuestro agente de IA puede usar.
// La descripción es MUY importante, ya que la IA la usa para decidir qué herramienta elegir.

export const availableTools = {
  // Herramienta para crear una reserva
  create_reservation: {
    name: 'create_reservation',
    description:
      'Crea una nueva reserva para un espacio físico en un horario determinado. Útil para agendar el uso de salones, auditorios o laboratorios.',
    parameters: {
      type: 'object',
      properties: {
        lugar: {
          type: 'string',
          description:
            "El nombre exacto del espacio físico que se desea reservar. Por ejemplo, 'Salón 101' o 'Auditorio Principal'.",
        },
        hora_inicio: {
          type: 'string',
          description:
            "La fecha y hora de inicio de la reserva en formato ISO 8601. Por ejemplo, '2025-07-11T10:00:00Z'.",
        },
        hora_final: {
          type: 'string',
          description:
            "La fecha y hora de finalización de la reserva en formato ISO 8601. Por ejemplo, '2025-07-11T11:30:00Z'.",
        },
        clase: {
          type: 'string',
          description:
            "El propósito o nombre de la clase/evento para la cual se hace la reserva. Por ejemplo, 'Clase de Refuerzo de Matemáticas'.",
        },
      },
      required: ['lugar', 'hora_inicio', 'hora_final', 'clase'],
    },
  },

  // Herramienta para crear un evento en el calendario
  create_event: {
    name: 'create_event',
    description:
      'Programa un nuevo evento general en el calendario de la institución, como una charla, un acto cívico o una reunión.',
    parameters: {
      type: 'object',
      properties: {
        tema: {
          type: 'string',
          description: 'El título o tema principal del evento.',
        },
        descripcion: {
          type: 'string',
          description: 'Una breve descripción de qué tratará el evento.',
        },
        lugar: {
          type: 'string',
          description: 'El nombre del lugar donde se realizará el evento.',
        },
        fecha: {
          type: 'string',
          description: 'La fecha y hora del evento en formato ISO 8601.',
        },
        acargo: {
          type: 'string',
          description:
            'El nombre de la persona o departamento a cargo del evento.',
        },
      },
      required: ['tema', 'descripcion', 'lugar', 'fecha', 'acargo'],
    },
  },

  // Herramienta para registrar trabajo social
  create_social_work: {
    name: 'create_social_work',
    description:
      'Registra una nueva actividad de trabajo social realizada por un estudiante.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description:
            'El nombre del estudiante que realizó el trabajo social.',
        },
        description: {
          type: 'string',
          description: 'Una descripción de la actividad realizada.',
        },
        hours: {
          type: 'number',
          description: 'El número de horas completadas.',
        },
        date: {
          type: 'string',
          description:
            'La fecha en que se completó el trabajo social, en formato YYYY-MM-DD.',
        },
      },
      required: ['name', 'description', 'hours', 'date'],
    },
  },

  // Herramienta para obtener los espacios disponibles de la organización
  get_places: {
    name: 'get_places',
    description:
      'Obtiene una lista de todos los espacios físicos (salones, auditorios, etc.) disponibles en la organización actual. Útil para saber qué lugares se pueden reservar o consultar.',
    parameters: {
      type: 'object',
      properties: {}, // No requiere parámetros específicos, ya que usa la orgId del usuario
    },
  },

  // Herramienta para obtener los departamentos disponibles de la organización
  get_departments: {
    name: 'get_departments',
    description:
      'Obtiene una lista de todos los departamentos disponibles en la organización actual. Útil para saber qué áreas o grupos existen.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },

  consultar_asistencia: {
    name: 'consultar_asistencia',
    description:
      'Verifica el registro de asistencia de un estudiante específico en una fecha o rango de fechas determinado.',
    parameters: {
      type: 'object',
      properties: {
        nombre_estudiante: {
          type: 'string',
          description: 'El nombre completo del estudiante a consultar.',
        },
        fecha: {
          type: 'string',
          description:
            'La fecha a consultar en formato YYYY-MM-DD. Si se omite, se asume la fecha actual.',
        },
      },
      required: ['nombre_estudiante'],
    },
  },

  obtener_info_estudiante: {
    name: 'obtener_info_estudiante',
    description:
      'Busca y devuelve información clave de un estudiante, como su grado, escuela y datos de contacto del acudiente.',
    parameters: {
      type: 'object',
      properties: {
        nombre_estudiante: {
          type: 'string',
          description: 'El nombre completo del estudiante a buscar.',
        },
      },
      required: ['nombre_estudiante'],
    },
  },

  send_notification: {
    name: 'send_notification',
    description:
      "Envía un mensaje o notificación a todos los usuarios que tienen uno o más roles específicos (ej. ['Estudiante', 'Profesor'], ['Acudiente']).",
    parameters: {
      type: 'object',
      properties: {
        roles: {
          type: 'array',
          items: { type: 'string' },
          description:
            "Una lista de los códigos de los roles a los que se enviará la notificación. Debe ser uno o más de los roles válidos del sistema.",
        },
        message: {
          type: 'string',
          description: 'El contenido del mensaje que se desea enviar.',
        },
      },
      required: ['roles', 'message'],
    },
  },

  crear_citacion: {
    name: 'crear_citacion',
    description:
      'Agenda una citación formal para un estudiante con un miembro del personal en una fecha y hora específicas. Si se conoce el grado, incluirlo para una búsqueda más precisa.',
    parameters: {
      type: 'object',
      properties: {
        nombre_estudiante: {
          type: 'string',
          description: 'El nombre completo o parcial del estudiante que está siendo citado.',
        },
        nombre_grado: {
          type: 'string',
          description: 'El nombre exacto del grado del estudiante (ej. "1A", "5C", "11A"). Opcional, pero recomendado para precisión.',
        },
        motivo: {
          type: 'string',
          description: 'La razón o el motivo de la citación.',
        },
        fecha_hora: {
          type: 'string',
          description:
            'La fecha y hora de la citación en formato ISO 8601. Por ejemplo, "2025-07-15T09:00:00Z".',
        },
      },
      required: ['nombre_estudiante', 'motivo', 'fecha_hora'],
    },
  },

  buscar_estudiante_en_grado: {
    name: 'buscar_estudiante_en_grado',
    description:
      'Realiza una búsqueda difusa de estudiantes dentro de un grado o curso específico. Útil para encontrar el ID de un estudiante cuando no se sabe el nombre completo. ademas el drado debe tener esta estructura: 1A, 5C, 11A o sin la letra, pero no: Grado 1, etc',
    parameters: {
      type: 'object',
      properties: {
        texto_busqueda: {
          type: 'string',
          description: 'El nombre o parte del nombre del estudiante a buscar.',
        },
        nombre_grado: {
          type: 'string',
          description: 'El nombre exacto del grado en el que se debe buscar.',
        },
      },
      required: ['texto_busqueda', 'nombre_grado'],
    },
  },

  buscar_estudiante_general: {
    name: 'buscar_estudiante_general',
    description:
      'Realiza una búsqueda difusa general de estudiantes en toda la organización. Usar cuando no se conoce el grado del estudiante.',
    parameters: {
      type: 'object',
      properties: {
        texto_busqueda: {
          type: 'string',
          description: 'El nombre o parte del nombre del estudiante a buscar.',
        },
      },
      required: ['texto_busqueda'],
    },
  },

  consultar_trabajo_social_por_estado: {
    name: 'consultar_trabajo_social_por_estado',
    description:
      "Consulta los registros de trabajo social filtrados por su estado (ej. 'upcoming' para próximos, 'past' para pasados). Útil para ver trabajos sociales pendientes o completados.",
    parameters: {
      type: 'object',
      properties: {
        estado: {
          type: 'string',
          description: "El estado del trabajo social a consultar (ej. 'upcoming', 'past').",
        },
      },
      required: ['estado'],
    },
  },

  save_ai_memory: {
    name: 'save_ai_memory',
    description:
      'Guarda una pieza de información en la memoria de la IA, asociada a un usuario, rol u organización específica. Útil para recordar preferencias, datos importantes o contexto de conversaciones pasadas.',
    parameters: {
      type: 'object',
      properties: {
        user_id: {
          type: 'number',
          description: 'El ID del usuario al que se asocia la memoria. Puede ser nulo si la memoria es para un rol o la organización.',
        },
        organization_id: {
          type: 'string',
          description: 'El ID de la organización a la que se asocia la memoria. Puede ser nulo si la memoria es para un usuario o rol específico.',
        },
        role: {
          type: 'string',
          description: "El rol al que se asocia la memoria (ej. 'admin', 'student'). Puede ser nulo si la memoria es para un usuario o la organización.",
        },
        key: {
          type: 'string',
          description: "La clave única para identificar la información guardada (ej. 'color_favorito', 'preferencia_notificacion').",
        },
        value: {
          type: 'string',
          description: "El valor de la información a guardar (ej. 'azul', 'email').",
        },
      },
      required: ['key', 'value'],
    },
  },

  retrieve_ai_memory: {
    name: 'retrieve_ai_memory',
    description:
      'Recupera una pieza de información de la memoria de la IA, asociada a un usuario, rol u organización específica. Útil para recordar preferencias, datos importantes o contexto de conversaciones pasadas.',
    parameters: {
      type: 'object',
      properties: {
        user_id: {
          type: 'number',
          description: 'El ID del usuario al que se asocia la memoria. Puede ser nulo si la memoria es para un rol o la organización.',
        },
        organization_id: {
          type: 'string',
          description: 'El ID de la organización a la que se asocia la memoria. Puede ser nulo si la memoria es para un usuario o rol específico.',
        },
        role: {
          type: 'string',
          description: "El rol al que se asocia la memoria (ej. 'admin', 'student'). Puede ser nulo si la memoria es para un usuario o la organización.",
        },
        key: {
          type: 'string',
          description: 'La clave única para identificar la información a recuperar.',
        },
      },
      required: ['key'],
    },
  },
};
