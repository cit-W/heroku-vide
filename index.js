import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import path from 'path';
import pool from './config/db.js';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
import general from './routes/general.js';
import accountRoutes from './routes/auth/account.js';
import horariosCursosRoutes from './routes/horarios/horarios_cursos.js';
import horariosProfesRoutes from './routes/horarios/horarios_profes.js';
import infoEstudiantesRoutes from './routes/students/estudiantes.js';
import rastrearRoutes from './routes/rastrear.js';
import reportesRoutes from './routes/reports/reportes.js';
import reservasRoutes from './routes/reservas/reservas.js';
import userRoutes from './routes/auth/usuarios.js';
import espacioRoutes from './routes/espacio.js';
import gradoRoutes from './routes/grado.js';
import departamentoRoutes from './routes/departamento.js';
import escuelaRoutes from './routes/escuela.js';
import roleRoutes from './routes/role.js';
import trabajoSocialRoutes from './routes/trabajo_social.js';
import cronogramaRoutes from './routes/cronograma.js';
import citacionesRoutes from './routes/reservas/citaciones.js';
import notificationsRoutes from './routes/notifications.js';

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
app.use('/espacio', espacioRoutes);
app.use('/grado', gradoRoutes);
app.use('/departamento', departamentoRoutes);
app.use('/role', roleRoutes);
app.use('/escuela', escuelaRoutes);
app.use('/trabajo_social', trabajoSocialRoutes);
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

export default app;