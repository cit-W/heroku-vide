const express = require('express');
const router = express.Router();

router.get('/add_trabajo_social', async (req, res) => {
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

router.get('/ids_trabajo_social', async (req, res) => {
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

router.get('/registro_trabajo_social', async (req, res) => {
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
