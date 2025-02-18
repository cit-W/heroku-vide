const express = require('express');
const router = express.Router();
const pool = require('../db.js');
const axios = require('axios');

// Configuración de OneSignal
const ONE_SIGNAL_APP_ID = 'e5d7274b-f71f-4fb0-80d9-04e539cddb77';
const ONE_SIGNAL_API_KEY = 'ZDU0M2QzYjQtYmZiYy00ZGVjLWI0NjgtNDk0YjUxNjFmZWYx';

// POST - Registrar o actualizar usuario con OneSignal player_id y rol
router.post('/register-user', async (req, res) => {
  try {
    // Puedes enviar player_id, user_id (o correo, etc.), y role (profesor, estudiante)
    const { player_id, user_id, role } = req.body; 
    if (!player_id || !role || !user_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan datos (player_id, user_id, role) en la petición.' 
      });
    }

    // 1) Guardar/actualizar en DB local
    //    Ajusta la tabla y campos según tu esquema de usuario
    const query = `
      INSERT INTO android_mysql.users (user_id, player_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id)
      DO UPDATE SET player_id = EXCLUDED.player_id, role = EXCLUDED.role;
    `;
    const values = [ user_id, player_id, role ];
    await pool.query(query, values);

    // 2) Asignar tag en OneSignal con la API
    //    Este endpoint actualiza las tags del usuario en OneSignal
    await axios.post(
      `https://onesignal.com/api/v1/players/${player_id}/on_session`,
      {
        app_id: ONE_SIGNAL_APP_ID,
        tags: { role: role }
      },
      {
        headers: {
          Authorization: `Basic ${ONE_SIGNAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return res.json({ success: true, message: 'Usuario registrado y tag asignado correctamente.' });
  } catch (error) {
    console.error('Error al registrar usuario:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Ocurrió un error al registrar el usuario.',
      error: error.message 
    });
  }
});

// POST - Enviar notificación (opcionalmente filtrada por rol)
router.post('/send-notification', async (req, res) => {
  try {
    const { title, body, role, departamento, nivel } = req.body;

    // Validar título y body
    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos (title, body) en la petición.'
      });
    }

    // Construir array de filtros dinámicamente
    let filters = [];

    // Helper para añadir un filtro con operador AND entre cada uno
    const addTagFilter = (tagKey, tagValue) => {
      if (filters.length > 0) {
        filters.push({ operator: 'AND' });
      }
      filters.push({
        field: 'tag',
        key: tagKey,
        relation: '=',
        value: tagValue
      });
    };

    // Si 'role' tiene valor, agregamos el filtro
    if (role && role.trim() !== '') {
      addTagFilter('role', role);
    }

    // Si 'departamento' tiene valor, agregamos el filtro
    if (departamento && departamento.trim() !== '') {
      addTagFilter('departamento', departamento);
    }

    // Si 'nivel' tiene valor, agregamos el filtro
    if (nivel && nivel.trim() !== '') {
      addTagFilter('nivel', nivel);
    }

    // Si no hay filtros, enviamos a todos (filters = undefined)
    const filtersToUse = (filters.length > 0) ? filters : undefined;

    // Llamada a OneSignal
    const response = await axios.post(
      'https://onesignal.com/api/v1/notifications',
      {
        app_id: ONE_SIGNAL_APP_ID,
        filters: filtersToUse,
        contents: {
          en: body,
          es: body
        },
        headings: {
          en: title,
          es: title
        },
        // Opciones de prioridad y visibilidad
        android_channel_id: '5fc000b3-506f-4dd6-8f97-88e0f3b0c9c7',
        priority: 'high',
        visibility: 1
      },
      {
        headers: {
          Authorization: `Basic ${ONE_SIGNAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return res.json({
      success: true,
      message: 'Notificación enviada correctamente',
      data: response.data
    });

  } catch (error) {
    console.error('Error al enviar notificación:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al enviar la notificación.',
      error: error.message
    });
  }
});

module.exports = router;