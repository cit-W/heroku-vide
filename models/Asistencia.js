import pool from '../config/db.js';

const Attendance = {
    async markAttendance(id, fecha) {
        const currentDate = new Date();
        const [hours, minutes, seconds] = fecha.split(":");
        currentDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), parseInt(seconds, 10));
        const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
        const query = "INSERT INTO asistencia.asistencia_diaria (id, fecha) VALUES ($1, $2)";
        await pool.query(query, [id, formattedDate]);
    },

    async getDailyRecord(id) {
        const query = "SELECT * FROM asistencia.asistencia_diaria WHERE id = $1";
        const { rows } = await pool.query(query, [id]);
        return rows;
    },

    async getAttendanceByStudentName(studentName, date, orgId, client = pool) {
    const query = `
      SELECT u.name, ad.fecha
      FROM asistencia.asistencia_diaria ad
      JOIN users u ON ad.id = u.id
      WHERE u.name ILIKE $1
        AND u.organizacion_id = $2
        AND ad.fecha::date = $3::date;
    `;
    const { rows } = await client.query(query, [studentName, orgId, date]);
    return rows;
  },
};

export default Attendance;
