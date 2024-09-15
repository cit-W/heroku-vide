const express = require('express');
const router = express.Router();

router.get('/crear_horario', async (req, res) => {
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

router.get('/crear_tabla_cursos', async (req, res) => {
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

router.get('/delete_horario', async (req, res) => {
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

router.get('/delete_horarios_all', async (req, res) => {
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

router.get('/registro_horario_account', async (req, res) => {
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

router.get('/registro_horario', async (req, res) => {
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

router.get('/ver_horario', async (req, res) => {
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
