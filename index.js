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

// Ruta de prueba
app.get('/prueba', (req, res) => {
  console.log('correcto');
  res.send('Prueba correcta');
});

// Ruta html - jes
app.get('/jes', (req, res) => res.render('pages/prueba'));

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
