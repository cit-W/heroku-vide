const express = require('express'); 
const multer = require('multer');
const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');

const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Crear directorio 'uploads' si no existe
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configuración de multer para subir solo archivos .xlsx
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // Directorio donde se almacenarán los archivos
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));  // Mantener la extensión .xlsx
  }
});

// Función para filtrar archivos .xlsx
const fileFilter = (req, file, cb) => {
  const filetypes = /xlsx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
  if (extname) {
    return cb(null, true);
  } else {
    cb('Error: Solo archivos .xlsx son permitidos!');
  }
};

// Configuración de multer con el filtro para .xlsx
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter
});

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
  res.render('pages/upload');
});

// Ruta para subir el archivo Excel (.xlsx)
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No se subió ningún archivo.');
  }

  try {
    // Leer el archivo Excel (.xlsx)
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);

    // Acceder a la primera hoja de cálculo
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convertir la hoja de cálculo a formato JSON
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    // Conexión a la base de datos
    const client = await pool.connect();

    // Vaciar la tabla antes de insertar nuevos datos
    await client.query('DELETE FROM restaurante.lista_general');

    const insertQuery = 'INSERT INTO restaurante.lista_general(nombre, id, curso, pago_mensual) VALUES($1, $2, $3, $4)';

    // Iterar sobre las filas de datos (exceptuando la primera fila que tiene los encabezados)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Verificar si hay algún valor nulo en la fila
      if (row.includes(null)) {
        console.log('Se detectó un valor nulo en la fila:', row);
        break;  // Detener el bucle al detectar el primer valor nulo
      }

      const nombre = row[0];              // Columna de nombres
      const id = row[1];                  // Columna de ID
      const curso = row[2];               // Columna de curso
      const pago_mensual_basic = String(row[3].toLowerCase);
      pago_mensual_basic = getCleanedString(pago_mensual_basic)
      const pago_mensual = pago_mensual_basic.
      replace("si", "TRUE").
      replace("no", "FALSE")              // Columna de pago_mensual

      await client.query(insertQuery, [nombre, id, curso, pago_mensual]);
    }

    client.release();

    // Eliminar el archivo temporal
    fs.unlinkSync(filePath);

    res.send('Datos insertados correctamente en lista_general');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al procesar el archivo.');
  }
});

function getCleanedString(cadena){
  // Definimos los caracteres que queremos eliminar
  var specialChars = "!@#$^&%*()+=-[]\/{}|:<>?,.";

  // Los eliminamos todos
  for (var i = 0; i < specialChars.length; i++) {
      cadena= cadena.replace(new RegExp("\\" + specialChars[i], 'gi'), '');
  }   

  // Lo queremos devolver limpio en minusculas
  cadena = cadena.toLowerCase();

  // Quitamos espacios y los sustituimos por _ porque nos gusta mas asi
  cadena = cadena.replace(/ /g,"_");

  // Quitamos acentos y "ñ". Fijate en que va sin comillas el primer parametro
  cadena = cadena.replace(/á/gi,"a");
  cadena = cadena.replace(/é/gi,"e");
  cadena = cadena.replace(/í/gi,"i");
  cadena = cadena.replace(/ó/gi,"o");
  cadena = cadena.replace(/ú/gi,"u");
  cadena = cadena.replace(/ñ/gi,"n");
  return cadena;
}

// Ruta para actualizar el pago
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
