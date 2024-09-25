const express = require('express');
const multer = require('multer');
const path = require('path');
const xlsx = require('xlsx');

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

// Ruta para subir el archivo .xlsx
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No se subió ningún archivo.');
  }
  
  try {
    // Leer el archivo .xlsx
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    // Insertar datos en la base de datos
    const client = await pool.connect();
    const insertQuery = 'INSERT INTO restaurante.lista_general(nombre, id, curso, pago_mensual) VALUES($1, $2, $3, $4)';
    
    for (let row of data) {
      const { nombre, id, curso, pago_mensual } = row;
      await client.query(insertQuery, [nombre, id, curso, pago_mensual]);
    }
    
    client.release();
    res.send('Datos insertados correctamente en lista_general');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al procesar el archivo.');
  }
});

router.get('/update-pago', async (req, res) => {
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