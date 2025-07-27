import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import pool from './config/db.js';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cookieParser from 'cookie-parser';

const app = express();
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


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


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.get('/', (req, res) => res.render('pages/index'));


import generalRoutes from './routes/general_routes.js';
import roleRoutes from './routes/role_routes.js';
import userRoutes from './routes/auth/users.js';

import placeRoutes from './routes/place.js';
import accountRoutes from './routes/auth/account.js';

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
import userReservationRoutes from './routes/user_routes.js';
import verifyRoutes from './routes/auth/verify.js';
import refreshRoutes from './routes/auth/refresh.js';
import aiCounselorRoutes from './routes/ai_counselor.js';
import aiAgentRoutes from './routes/ai_agent.js';


app.use('/role', roleRoutes);
app.use('/user', userRoutes);

app.use('/general', generalRoutes);
app.use('/account', accountRoutes);
app.use('/place', placeRoutes);

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
app.use('/user-reservations', userReservationRoutes);
app.use('/auth', verifyRoutes);
app.use('/auth', refreshRoutes);
app.use('/api/ai/counselor', aiCounselorRoutes);
app.use('/api/ai/agent', aiAgentRoutes);


app.use(errorHandler);

export default app;