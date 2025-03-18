const Asistencia = {
    async marcarAsistencia(id, fecha) {
        const currentDate = new Date();
        const [hours, minutes, seconds] = fecha.split(":");
        currentDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), parseInt(seconds, 10));
        const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
        const query = "INSERT INTO asistencia.asistencia_diaria (id, fecha) VALUES ($1, $2)";
        await pool.query(query, [id, formattedDate]);
    },

    async obtenerRegistroDiario(id) {
        const query = "SELECT * FROM asistencia.asistencia_diaria WHERE id = $1";
        const { rows } = await pool.query(query, [id]);
        return rows;
    },
};

module.exports = Asistencia;