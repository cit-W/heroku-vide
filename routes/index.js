const express = require('express');
const path = require('path');

// Importar las rutas
const general = require('./routes/general');
const asistenciaRoutes = require('./routes/asistencia');
const accountRoutes = require('./routes/account');
const horariosCursosRoutes = require('./routes/horarios_cursos');
const horariosProfesRoutes = require('./routes/horarios_profes');
const infoEstudiantesRoutes = require('./routes/info_estudiantes');
const rastrearRoutes = require('./routes/rastrear');
const reportesRoutes = require('./routes/reportes');
const reservasRoutes = require('./routes/reservas');
const signInRoutes = require('./routes/sign_in');
const trabajoSocialRoutes = require('./routes/trabajo_social');
const registroEst = require('./routes/registroEst');

const PORT = process.env.PORT || 5001;

const app = express();

const { Pool } = require('pg');
const { register } = require('module');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
module.exports = pool;

app
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs');

// Ruta principal
app.get('/', (req, res) => res.render('pages/index'));

app.get('/db', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM asistencia.asistencia_diaria');
    const personas = result.rows;
    res.render('pages/db', { personas });
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

// Usar las rutas
app.use('/general', general);
app.use('/asistencia', asistenciaRoutes);
app.use('/account', accountRoutes);
app.use('/horarios_cursos', horariosCursosRoutes);
app.use('/horarios_profes', horariosProfesRoutes);
app.use('/info_estudiantes', infoEstudiantesRoutes);
app.use('/rastrear', rastrearRoutes);
app.use('/reportes', reportesRoutes);
app.use('/reservas', reservasRoutes);
app.use('/sign_in', signInRoutes);
app.use('/trabajo_social', trabajoSocialRoutes);
app.use('/registroEst', registroEst);

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
