const express = require('express');
const router = express.Router();

router.get('/ids', async (req, res) => {
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

router.get('/registro_reservas', async (req, res) => {
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

router.get('/reportar', async (req, res) => {
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

router.get('/reservar_lugar', async (req, res) => {
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

module.exports = router;
