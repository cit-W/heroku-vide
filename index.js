const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 5001;

const app = express();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs');

// Ruta principal
app.get('/', (req, res) => res.render('pages/index'));

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

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
