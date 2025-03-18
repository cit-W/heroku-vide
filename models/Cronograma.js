const pool = require("../config/database");
const { format } = require("date-fns");

const Cronograma = {
    async crearEsquema(year) {
        const yearBefore = Number(year) - 1;
        const schemaCurrent = `${year}`;
        const schemaBefore = `${yearBefore}`;
        const client = await pool.connect();

        try {
        const schemaExistsResult = await client.query(
            `SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = $1)`,
            [schemaBefore]
        );
        const schemaExists = schemaExistsResult.rows[0].exists;

        await client.query("BEGIN");
        if (schemaExists) {
            await client.query(`DROP SCHEMA IF EXISTS "${schemaBefore}" CASCADE`);
        }

        await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaCurrent}"`);
        for (let i = 0; i < 12; i++) {
            const month = String(i + 1).padStart(2, "0");
            await client.query(`
            CREATE TABLE IF NOT EXISTS "${schemaCurrent}"."${month}" (
                id SERIAL PRIMARY KEY,
                tema VARCHAR(50) NOT NULL,
                acargo VARCHAR(40),
                mediagroup_video VARCHAR(20),
                mediagroup_sonido VARCHAR(20),
                fecha TIMESTAMPTZ NOT NULL,
                descripcion VARCHAR(200),
                lugar VARCHAR(40),
                n_semana INT NOT NULL
            )
            `);
        }
        await client.query("COMMIT");
        return "cronograma_registrado";
        } catch (error) {
        await client.query("ROLLBACK");
        throw error;
        } finally {
        client.release();
        }
    },

    async crearEvento(evento) {
        const eventDate = new Date(evento.fecha);
        const isoDate = eventDate.toISOString();
        const oneJan = new Date(eventDate.getFullYear(), 0, 1);
        const numberOfDays = Math.floor((eventDate - oneJan) / (24 * 60 * 60 * 1000));
        const resultWeek = Math.ceil((eventDate.getDay() + 1 + numberOfDays) / 7);
        const tableYear = eventDate.getFullYear().toString();
        const month = eventDate.toLocaleString("en-US", { month: "2-digit" });

        const query = `
        INSERT INTO "${tableYear}"."${month}" (tema, acargo, mediagroup_video, mediagroup_sonido, fecha, descripcion, lugar, n_semana)
        VALUES ($1, $2, $3, $4, $5::TIMESTAMPTZ, $6, $7, $8);
        `;
        const values = [evento.tema, evento.acargo, evento.mediagroup_video, evento.mediagroup_sonido, isoDate, evento.descripcion, evento.lugar, resultWeek];
        await pool.query(query, values);
        return "SUCCESS";
    },
};

module.exports = Cronograma;