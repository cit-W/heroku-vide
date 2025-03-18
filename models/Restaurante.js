const pool = require("../config/db");

const Restaurante = {
    async obtenerListaGeneral() {
        const query = "SELECT * FROM restaurante.lista_general";
        const { rows } = await pool.query(query);
        return rows.length > 0 ? rows : null;
    },

    async insertarDesdeExcel(data) {
        const insertQuery =
        "INSERT INTO restaurante.lista_general(nombre, id, curso, pago_mensual) VALUES($1, $2, $3, $4)";

        for (const row of data) {
        if (row.some((cell) => cell == null)) continue;

        let pago_mensual = String(row[3]).toLowerCase().trim();
        pago_mensual = pago_mensual === "si" ? true : pago_mensual === "no" ? false : null;

        if (pago_mensual !== null) {
            await pool.query(insertQuery, [row[0], row[1], row[2], pago_mensual]);
        }
        }
    },

    async actualizarPago(id, pago) {
        const updateQuery = "UPDATE restaurante.lista_general SET pago_mensual = $1 WHERE id = $2";
        await pool.query(updateQuery, [pago, id]);
    },

    async verificarPago(id) {
        const query = "SELECT * FROM restaurante.lista_general WHERE id = $1";
        const { rows } = await pool.query(query, [id]);
        return rows.length > 0 ? rows : null;
    },
};

module.exports = Restaurante;