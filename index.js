import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import pool from './config/db.js';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const app = express();
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helmet configuration
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  })
);
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
import generalRoutes from './routes/general_routes.js';
import roleRoutes from './routes/role_routes.js';
import userRoutes from './routes/auth/users.js';
import gradeRoutes from './routes/grade.js';
import placeRoutes from './routes/place.js';
import accountRoutes from './routes/auth/account.js';
import educationLevelRoutes from './routes/education_level.js';
import trackRoutes from './routes/track.js';
import reportsRoutes from './routes/reports/reports.js';
import scheduleRoutes from './routes/schedule.js';
import userDevicesRoutes from './routes/user_device.js';
import reservationsRoutes from './routes/reservations/reservations.js';
import departmentRoutes from './routes/department.js';
import appointmentsRoutes from './routes/reservations/appointments.js';
import socialWorkRoutes from './routes/social_work_routes.js';
import notificationsRoutes from './routes/notifications.js';
import courseSchedulesRoutes from './routes/schedules/course_schedules.js';
import teacherSchedulesRoutes from './routes/schedules/teacher_schedules.js';
import studentsRoutes from './routes/students/students.js';

// Use routes
app.use('/role', roleRoutes);
app.use('/user', userRoutes);
app.use('/grade', gradeRoutes);
app.use('/general', generalRoutes);
app.use('/account', accountRoutes);
app.use('/place', placeRoutes);
app.use('/education-level', educationLevelRoutes);
app.use('/track', trackRoutes);
app.use('/reports', reportsRoutes);
app.use('/schedule', scheduleRoutes);
app.use('/social-work', socialWorkRoutes);
app.use('/department', departmentRoutes);
app.use('/reservations', reservationsRoutes);
app.use('/appointments', appointmentsRoutes);
app.use('/user-devices', userDevicesRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/course-schedules', courseSchedulesRoutes);
app.use('/teacher-schedules', teacherSchedulesRoutes);
app.use('/students', studentsRoutes);

// Error handling
app.use(errorHandler);

// Database test route
app.get('/db', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM users'
    );
    const personas = result.rows;
    res.render('pages/db', { personas });
    client.release();
  } catch (err) {
    console.error(err);
    res.send('Error ' + err);
  }
});



const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));

export default app;
