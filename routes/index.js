const express = require('express');
const path = require('path');
const fs = require('fs');

// Importar las rutas
const general = require('./routes/general');
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
const asistenciaRoutes = require('./routes/asistencia');

const PORT = process.env.PORT || 5001;

const app = express();

const { Pool } = require('pg');

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

// Función para escanear rutas en un archivo
function scanRoutesInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const routeRegex = /router\.(get|post|put|delete)\s*\(\s*['"]([^'"]+)['"]/g;
  const routes = [];
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    routes.push(match[2]);
  }
  return routes;
}

// Definir la estructura de rutas
const routes = {
  '/general': {
    title: 'General',
    subroutes: scanRoutesInFile('./routes/general.js')
  },
  '/account': {
    title: 'Cuenta',
    subroutes: scanRoutesInFile('./routes/account.js')
  },
  '/horarios_cursos': {
    title: 'Horarios de Cursos',
    subroutes: scanRoutesInFile('./routes/horarios_cursos.js')
  },
  '/horarios_profes': {
    title: 'Horarios de Profesores',
    subroutes: scanRoutesInFile('./routes/horarios_profes.js')
  },
  '/info_estudiantes': {
    title: 'Información de Estudiantes',
    subroutes: scanRoutesInFile('./routes/info_estudiantes.js')
  },
  '/rastrear': {
    title: 'Rastrear',
    subroutes: scanRoutesInFile('./routes/rastrear.js')
  },
  '/reportes': {
    title: 'Reportes',
    subroutes: scanRoutesInFile('./routes/reportes.js')
  },
  '/reservas': {
    title: 'Reservas',
    subroutes: scanRoutesInFile('./routes/reservas.js')
  },
  '/sign_in': {
    title: 'Iniciar Sesión',
    subroutes: scanRoutesInFile('./routes/sign_in.js')
  },
  '/trabajo_social': {
    title: 'Trabajo Social',
    subroutes: scanRoutesInFile('./routes/trabajo_social.js')
  },
  '/registroEst': {
    title: 'Registro de Estudiantes',
    subroutes: scanRoutesInFile('./routes/registroEst.js')
  },
  '/asistencia': {
    title: 'Asistencia',
    subroutes: scanRoutesInFile('./routes/asistencia.js')
  }
};

// Middleware para agregar rutas relacionadas a res.locals
app.use((req, res, next) => {
  res.locals.routes = routes;
  res.locals.currentPath = req.path;
  next();
});

// Ruta principal
app.get('/', (req, res) => res.render('pages/index', { routes }));

// Rutas para mostrar subrutas
Object.keys(routes).forEach(route => {
  app.get(route, (req, res) => {
    res.render('pages/route-list', { 
      title: routes[route].title,
      subroutes: routes[route].subroutes.map(subroute => route + subroute)
    });
  });
});

app.get('/db', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM personas');
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
app.use('/asistencia', asistenciaRoutes);

app.listen(PORT, () => console.log(`Listening on ${PORT}`));