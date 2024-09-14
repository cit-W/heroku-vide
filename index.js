const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 5001;

const app = express();

app
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs');

// Ruta principal
app.get('/', (req, res) => res.render('pages/index'));

// database
app.get('/database', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM personas');
    res.render('pages/index', { personas: result.rows });
  } catch (err) {
    console.error(err);
    res.send('Error al conectar a la base de datos.');
  }
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
