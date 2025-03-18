require('dotenv').config();
const express = require('express');
const path = require('path');
const pool = require('./db.js');
const helmet = require('helmet');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Helmet configuration
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
  }
}));
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.hidePoweredBy());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => res.render('pages/index'));

// Import routes
const general = require('./routes/general');
const accountRoutes = require('./routes/auth/account');
const horariosCursosRoutes = require('./routes/horarios/horarios_cursos.js');
const horariosProfesRoutes = require('./routes/horarios/horarios_profes.js');
const infoEstudiantesRoutes = require('./routes/students/estudiantes.js');
const rastrearRoutes = require('./routes/rastrear');
const reportesRoutes = require('./routes/reports/reportes');
const reservasRoutes = require('./routes/reservas/reservas.js');
const userRoutes = require('./routes/auth/usuarios.js');
const trabajoSocialRoutes = require('./routes/trabajo_social');
const restauranteRoutes = require('./routes/restaurante');
const cronogramaRoutes = require('./routes/cronograma');
const citacionesRoutes = require('./routes/reservas/citaciones.js');
const notificationsRoutes = require('./routes/notifications');

// Use routes
app.use('/general', general);
app.use('/account', accountRoutes);
app.use('/horarios_cursos', horariosCursosRoutes);
app.use('/horarios_profes', horariosProfesRoutes);
app.use('/info_estudiantes', infoEstudiantesRoutes);
app.use('/rastrear', rastrearRoutes);
app.use('/reportes', reportesRoutes);
app.use('/reservas', reservasRoutes);
app.use('/user', userRoutes);
app.use('/trabajo_social', trabajoSocialRoutes);
app.use('/restaurante', restauranteRoutes);
app.use('/cronograma', cronogramaRoutes);
app.use('/citaciones', citacionesRoutes);
app.use('/notifications', notificationsRoutes);

// Error handling
app.use(errorHandler);

// Database test route
app.get('/db', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM restaurante.lista_general');
    const personas = result.rows;
    console.log(personas)
    res.render('pages/db', { personas });
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

async function createUsersTableIfNotExists() {
  const createQuery = `
    CREATE TABLE IF NOT EXISTS android_mysql.usersNotifications (
      user_id VARCHAR(100) PRIMARY KEY,
      player_id VARCHAR(200) NOT NULL,
      role VARCHAR(50) NOT NULL
    );
  `;
  try {
    await pool.query(createQuery);
    console.log('Tabla users verificada/creada correctamente.');
  } catch (error) {
    console.error('Error al crear/verificar la tabla users:', error.message);
  }
}

// Llamamos a la función al iniciar el servidor
createUsersTableIfNotExists();

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));