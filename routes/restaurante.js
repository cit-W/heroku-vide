const express = require('express');
const multer = require('multer');
const path = require('path');
const xml2js = require('xml2js');
const fs = require('fs');

const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // Directorio donde se almacenarán los archivos
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.get('/db', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM restaurante.lista_general');
    const personas = result.rows;
    client.release();
    
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.send("No_hay_tablas");
    }
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

// Ruta para mostrar el formulario de carga
router.get('/upload', (req, res) => {
  res.render('upload');
});

// Ruta para subir el archivo XML
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No se subió ningún archivo.');
  }
  
  try {
    // Leer el archivo XML
    const xmlData = fs.readFileSync(req.file.path, 'utf8');
    
    // Parsear XML a JSON
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    // Asumimos que la estructura XML tiene un elemento raíz y elementos hijos para cada registro
    const data = result.root.item; // Ajusta esto según la estructura de tu XML
    
    // Insertar datos en la base de datos
    const client = await pool.connect();
    const insertQuery = 'INSERT INTO restaurante.lista_general(nombre, id, curso, pago_mensual) VALUES($1, $2, $3, $4)';
    
    for (let row of data) {
      const nombre = row.nombre[0];
      const id = row.id[0];
      const curso = row.curso[0];
      const pago_mensual = row.pago_mensual[0];
      await client.query(insertQuery, [nombre, id, curso, pago_mensual]);
    }
    
    client.release();
    
    // Eliminar el archivo temporal
    fs.unlinkSync(req.file.path);
    
    res.send('Datos insertados correctamente en lista_general');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al procesar el archivo.');
  }
});

router.post('/update-pago', async (req, res) => {
  const { id, pago_mensual } = req.query;  // Cambiado de req.query a req.body
  
  if (!id || typeof pago_mensual === 'undefined') {
    return res.status(400).send('ID y pago_mensual son requeridos.');
  }
  
  try {
    const client = await pool.connect();
    const updateQuery = 'UPDATE restaurante.lista_general SET pago_mensual = $1 WHERE id = $2';
    await client.query(updateQuery, [pago_mensual, id]);
    client.release();
    
    res.send('Pago mensual actualizado correctamente');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al actualizar el pago mensual.');
  }
});

module.exports = router;