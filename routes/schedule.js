import { format } from 'date-fns';
import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { ValidationError, DatabaseError } from '../errors/CustomError.js';
import pool from '../config/db.js';
import helmet from 'helmet';
import { resolveNamesToIds } from '../models/resolveNamesToIds.js';
import { getMonthlyTopic, setMonthlyTopic } from '../models/MonthlyTopic.js';

const router = express.Router();

router.use(verifyToken, async (req, res, next) => {
  const client = await pool.connect();
  try {

    await client.query("SELECT set_config('app.current_org_id', $1, false)", [
      req.user.orgId.toString(),
    ]);
    req.dbClient = client;
    next();
  } catch (error) {
    client.release();
    next(error);
  }
});

router.use(helmet());
router.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
    },
  })
);

router.post('/create-event', async (req, res) => {
  try {
    const {
      tema,
      acargo,
      mediagroup_video,
      mediagroup_sonido,
      fecha,
      descripcion,
      lugar, // This is now the place name, not ID
    } = req.body;

    const organization_id = req.user.orgId;

    // Resolve place name to place_id
    const resolvedIds = await resolveNamesToIds({
      organizacion_id: organization_id,
      place: lugar,
    });
    const place_id = resolvedIds.place_id;

    const eventDate = new Date(fecha);
    const isoDate = eventDate.toISOString();

    const oneJan = new Date(eventDate.getFullYear(), 0, 1);
    const numberOfDays = Math.floor(
      (eventDate - oneJan) / (24 * 60 * 60 * 1000)
    );
    const result_week = Math.ceil((eventDate.getDay() + 1 + numberOfDays) / 7);

    const query_create_event = `
            INSERT INTO events
            (organization_id, tema, acargo, mediagroup_video, mediagroup_sonido, fecha, descripcion, place_id, n_semana)
            VALUES( $1, $2, $3, $4, $5, $6, $7, $8, $9 );
        `;

    const values = [
      organization_id,
      tema,
      acargo,
      mediagroup_video,
      mediagroup_sonido,
      isoDate,
      descripcion,
      place_id,
      result_week,
    ];

    const client = req.dbClient;
    await client.query(query_create_event, values);

    res.json({ success: true, data: 'SUCCESS' });
  } catch (err) {
    console.error('Error al crear el evento: ', err);
    res.status(500).send('Error al crear evento: ' + err.message);
  }
});

router.post('/delete-event', async (req, res) => {
  try {
    const { id } = req.query;
    const organization_id = req.user.orgId;

    if (!id) {
      res.status(400).send("El parámetro 'id' es requerido.");
      return;
    }

    const client = req.dbClient;
    const query = `
            DELETE
            FROM events
            WHERE id = $1 AND organization_id = $2;
        `;
    const result = await client.query(query, [id, organization_id]);

    res.json({ success: true, data: 'success' });
  } catch (err) {
    console.error('Error al consultar la tabla: ', err);
    res.status(500).send('Error al consultar la tabla: ' + err.message);
  }
});

router.get('/month-events', async (req, res) => {
  try {
    const { month, year } = req.query;
    const organization_id = req.user.orgId;

    if (!month || !year || !organization_id) {
      res.status(400).send("Los parámetros 'month', 'year' y 'organization_id' son requeridos.");
      return;
    }

    const client = req.dbClient;
    const query = `
            SELECT *
            FROM mview_events_details
            WHERE EXTRACT(MONTH FROM fecha) = $1
              AND EXTRACT(YEAR FROM fecha) = $2
              AND organization_id = $3;
        `;
    const result = await client.query(query, [month, year, organization_id]);

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows });
    } else {
      res.json({ success: false, data: 'No_hay_eventos' });
    }
  } catch (err) {
    console.error('Error al consultar la tabla: ', err);
    res.status(500).send('Error al consultar la tabla: ' + err.message);
  }
});

router.get('/month-topic', async (req, res) => {
  try {
    const { month, year } = req.query;
    const organization_id = req.user.orgId;

    if (!month || !year) {
      res.status(400).send("Los parámetros 'month' y 'year' son requeridos.");
      return;
    }

    const client = req.dbClient;
    const topic = await getMonthlyTopic(organization_id, year, month, client);

    if (topic) {
      res.json({ success: true, data: topic });
    } else {
      res.json({ success: false, data: 'No se encontró un tema para el mes especificado.' });
    }
  } catch (err) {
    console.error('Error al consultar el tema del mes: ', err);
    res.status(500).send('Error al consultar el tema del mes: ' + err.message);
  }
});

router.post('/month-topic', async (req, res) => {
  try {
    const { month, year, topic } = req.body;
    const organization_id = req.user.orgId;

    if (!month || !year || !topic) {
      res.status(400).send("Los parámetros 'month', 'year' y 'topic' son requeridos.");
      return;
    }

    const client = req.dbClient;
    await setMonthlyTopic(organization_id, year, month, topic, client);

    res.json({ success: true, message: 'Tema del mes guardado exitosamente.' });
  } catch (err) {
    console.error('Error al guardar el tema del mes: ', err);
    res.status(500).send('Error al guardar el tema del mes: ' + err.message);
  }
});

router.get('/week-events', async (req, res) => {
  try {
    const organization_id = req.user.orgId;

    if (!organization_id) {
      res.status(400).send("El parámetro 'organization_id' es requerido.");
      return;
    }

    var currentdate = new Date();
    var oneJan = new Date(currentdate.getFullYear(), 0, 1);
    var numberOfDays = Math.floor(
      (currentdate - oneJan) / (24 * 60 * 60 * 1000)
    );
    var result_week = Math.ceil((currentdate.getDay() + 1 + numberOfDays) / 7);

    const client = req.dbClient;
    const query = `
            SELECT *
            FROM mview_events_details
            WHERE n_semana = $1 AND organization_id = $2;
        `;
    const result = await client.query(query, [result_week, organization_id]);

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows });
    } else {
      res.json({ success: false, data: 'No_hay_eventos' });
    }
  } catch (err) {
    console.error('Error al consultar la tabla: ', err);
    res.status(500).send('Error al consultar la tabla: ' + err.message);
  }
});

router.get('/next-events', async (req, res) => {
  try {
    const organization_id = req.user.orgId;

    if (!organization_id) {
      res.status(400).send("El parámetro 'organization_id' es requerido.");
      return;
    }

    var currentdate = new Date();
    var oneJan = new Date(currentdate.getFullYear(), 0, 1);
    var numberOfDays = Math.floor(
      (currentdate - oneJan) / (24 * 60 * 60 * 1000)
    );
    var result_week = Math.ceil((currentdate.getDay() + 1 + numberOfDays) / 7);

    const client = req.dbClient;
    const query = `
            SELECT *
            FROM mview_events_details
            WHERE n_semana = $1 AND organization_id = $2;
        `;
    const result = await client.query(query, [result_week, organization_id]);

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows });
    } else {
      res.json({ success: false, data: 'No_hay_eventos' });
    }
  } catch (err) {
    console.error('Error al consultar la tabla: ', err);
    res.status(500).send('Error al consultar la tabla: ' + err.message);
  }
});

router.get('/closest-event', async (req, res) => {
  try {
    const organization_id = req.user.orgId;

    if (!organization_id) {
      res.status(400).send("El parámetro 'organization_id' es requerido.");
      return;
    }

    const client = req.dbClient;
    const query = `
            SELECT *
            FROM mview_events_details
            WHERE fecha >= NOW() AND organization_id = $1
            ORDER BY fecha ASC
            LIMIT 1;
        `;
    const result = await client.query(query, [organization_id]);

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows[0] });
    } else {
      res.json({ success: false, data: 'No se encontró ningún evento futuro' });
    }
  } catch (err) {
    console.log("err");
    console.log(err)
    console.error('Error al obtener el evento futuro más cercano: ', err);
    res.status(500).send('Error al obtener el evento: ' + err.message);
  }
});

router.get('/event', async (req, res) => {
  try {
    const { id } = req.query;
    const organization_id = req.user.orgId;

    if (!id || !organization_id) {
      res.status(400).send("Los parámetros 'id' y 'organization_id' son requeridos.");
      return;
    }

    const client = req.dbClient;
    const query = `
            SELECT  *
            FROM mview_events_details
            WHERE id = $1 AND organization_id = $2;
        `;
    const result = await client.query(query, [id, organization_id]);

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows[0] });
    } else {
      res.json({ success: false, data: 'No_hay_evento' });
    }
  } catch (err) {
    console.error('Error al consultar el evento: ', err);
    res.status(500).send('Error al consultar el evento: ' + err.message);
  }
});

router.post('/mediagroup', async (req, res) => {
  try {
    const { id, video, sonido } = req.query;
    const organization_id = req.user.orgId;

    if (!id || !organization_id) {
      res.status(400).send("Los parámetros 'id' y 'organization_id' son requeridos.");
      return;
    }

    const client = req.dbClient;
    const query = `
            UPDATE events
            SET mediagroup_video = $1,
                mediagroup_sonido = $2
            WHERE id = $3 AND organization_id = $4;
        `;
    const values = [video, sonido, id, organization_id];
    const result = await client.query(query, values);

    if (result.rowCount > 0) {
      res.json({ success: true, data: 'success' });
    } else {
      res.json({ success: false, data: 'No_se_encontró_evento_para_actualizar' });
    }
  } catch (err) {
    console.error('Error al actualizar mediagroup: ', err);
    res.status(500).send('Error al actualizar mediagroup: ' + err.message);
  }
});

router.get('/list-mediagroup', async (req, res) => {
  try {
    const organization_id = req.user.orgId;

    if (!organization_id) {
      res.status(400).send("El parámetro 'organization_id' es requerido.");
      return;
    }


    const currentdate = new Date();
    const oneJan = new Date(currentdate.getFullYear(), 0, 1);


    const numberOfDays = Math.floor(
      (currentdate - oneJan) / (24 * 60 * 60 * 1000)
    );
    const result_week = Math.ceil(
      (numberOfDays + currentdate.getDay() + 1) / 7
    );

    const client = req.dbClient;


    const query = `
            SELECT *
            FROM mview_events_details
            WHERE organization_id = $1 AND n_semana IN ($2, $3, $4, $5)
            ORDER BY fecha ASC;
        `;
    const values = [
      organization_id,
      result_week,
      result_week + 1,
      result_week + 2,
      result_week + 3,
    ];

    let result = await client.query(query, values);


    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {

      res.json({ success: false, data: 'No_hay_eventos' });
    }
  } catch (err) {
    console.error('Error al consultar los eventos de mediagroup: ', err);
    res
      .status(500)
      .json({ error: 'Error al consultar los eventos de mediagroup: ' + err.message });
  }
});

router.use((req, res, next) => {
  if (req.dbClient) {
    req.dbClient.release();
  }
  next();
});

export default router;