require('dotenv').config();

const express = require('express'); 
const multer = require('multer');
const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');
const { parse, isValid, format, eachDayOfInterval } = require('date-fns');

const router = express.Router();
const pool = require('../db.js');
const { render } = require('ejs');

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

router.get('/', async (req, res) => {
  res.render('pages/restaurante')
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
    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      // Verificar si hay algún valor nulo en la fila
      if (row.some(cell => cell == null)) {
        console.log('Se detectó un valor nulo en la fila:', row);
        continue;  // Saltar esta fila y continuar con la siguiente
      }

      const nombre = row[0];              // Columna de nombres
      const id = row[1];                  // Columna de ID
      const curso = row[2];               // Columna de curso
      
      // Procesar pago_mensual
      let pago_mensual = String(row[3]).toLowerCase().trim();
      pago_mensual = getCleanedString(pago_mensual);
      pago_mensual = pago_mensual === 'si' ? true : pago_mensual === 'no' ? false : null;

      if (pago_mensual !== null) {
        await client.query(insertQuery, [nombre, id, curso, pago_mensual]);
      } else {
        console.log(`Valor inválido de pago_mensual en la fila ${i + 1}: ${row[3]}`);
      }
    }

    client.release();

    // Eliminar el archivo temporal
    fs.unlinkSync(filePath);

    res.send('Datos insertados correctamente en lista_general');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al procesar el archivo: ' + error.message);
  }
});

function getCleanedString(cadena) {
  // Definimos los caracteres que queremos eliminar
  var specialChars = "!@#$^&%*()+=-[]\/{}|:<>?,.";

  // Los eliminamos todos
  for (var i = 0; i < specialChars.length; i++) {
    cadena = cadena.replace(new RegExp("\\" + specialChars[i], 'gi'), '');
  }   

  // Lo queremos devolver limpio en minúsculas
  cadena = cadena.toLowerCase();

  // Quitamos acentos y "ñ". Fíjate en que va sin comillas el primer parámetro
  cadena = cadena.replace(/á/gi,"a");
  cadena = cadena.replace(/é/gi,"e");
  cadena = cadena.replace(/í/gi,"i");
  cadena = cadena.replace(/ó/gi,"o");
  cadena = cadena.replace(/ú/gi,"u");
  cadena = cadena.replace(/ñ/gi,"n");
  return cadena;
}

// Ruta para mostrar el formulario
router.get('/update-pago-form', async (req, res) => {
  res.render('pages/update-pago', { 
      message: req.query.message,
      error: req.query.error 
  });
});

router.post('/update-pago', async (req, res) => {
  const { id, pago_mensual } = req.body;

  if (!id || typeof pago_mensual === 'undefined') {
      return res.render('pages/update-pago', {
          message: 'ID y pago_mensual son requeridos.',
          error: true
      });
  }

  try {
      const client = await pool.connect();
      const pagoBoolean = Boolean(pago_mensual === 'true');
      
      const updateQuery = 'UPDATE restaurante.lista_general SET pago_mensual = $1 WHERE id = $2';
      await client.query(updateQuery, [pagoBoolean, id]);
      client.release();

      res.render('pages/update-pago', {
          message: `Pago mensual actualizado correctamente a ${pagoBoolean ? 'Pagado' : 'No Pagado'}`,
          error: false
      });
  } catch (error) {
      console.error(error);
      res.render('pages/update-pago', {
          message: 'Error al actualizar el pago mensual.',
          error: true
      });
  }
});

router.get('/verificar_pago', async (req, res) => {
  try {
      const { ID } = req.query;

      if (!ID) {
          res.status(400).send("El parámetro 'ID' es requerido.");
          return;
      }

      const client = await pool.connect();
      const query = `
          SELECT * 
          FROM restaurante.lista_general 
          WHERE id = $1
      `;
      const result = await client.query(query, [ID]);
      client.release();

      if (result.rows.length > 0) {
        res.json({ success: true, data: result.rows });
      } else {
        res.json({ success: false, message: "No se encontraron registros para el ID proporcionado" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/registrar-asistencia', async (req, res) => {
  const { id, excepcion } = req.query;
  
  if (!id) {
    return res.status(400).send('El ID es requerido.');
  }

  const fechaActual = format(new Date(), 'dd-MM-yyyy');
  const horaActual = format(new Date(), 'HH:mm:ss');

  try {
    const client = await pool.connect();

    // Verificar si las columnas de la fecha actual y excepción existen
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'restaurante' 
      AND table_name = 'registro_general' 
      AND column_name IN ($1, $2)
    `;
    const columnCheck = await client.query(checkColumnQuery, [`${fechaActual}_hora`, `${fechaActual}_excepcion`]);

    // Si las columnas no existen, crearlas
    if (columnCheck.rows.length < 2) {
      const createColumnQuery = `
        ALTER TABLE restaurante.registro_general 
        ADD COLUMN IF NOT EXISTS "${fechaActual}_hora" TIME,
        ADD COLUMN IF NOT EXISTS "${fechaActual}_excepcion" TEXT
      `;
      await client.query(createColumnQuery);
    }

    // Verificar si el ID ya existe
    const checkIdQuery = `
      SELECT id 
      FROM restaurante.registro_general 
      WHERE id = $1
    `;
    const idCheck = await client.query(checkIdQuery, [id]);

    let query;
    let values;

    if (idCheck.rows.length === 0) {
      // Si el ID no existe, insertarlo con la hora actual y la excepción
      query = `
        INSERT INTO restaurante.registro_general (id, "${fechaActual}_hora", "${fechaActual}_excepcion")
        VALUES ($1, $2, $3)
      `;
      values = [id, horaActual, excepcion || null];
    } else {
      // Si el ID ya existe, actualizar la hora y la excepción
      query = `
        UPDATE restaurante.registro_general 
        SET "${fechaActual}_hora" = $1, "${fechaActual}_excepcion" = $2
        WHERE id = $3
      `;
      values = [horaActual, excepcion || null, id];
    }

    await client.query(query, values);
    client.release();

    res.json({ success: true, data: 'Asistencia registrada correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al registrar la asistencia: ' + error.message);
  }
});

// ESTADISTICAS Y DATOS

async function obtenerTodasLasFechas(client) {
  const query = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'restaurante'
    AND table_name = 'registro_general'
    AND column_name LIKE '%_hora'
  `;
  const result = await client.query(query);
  return result.rows.map(row => row.column_name.replace('_hora', ''));
}

// 1. Días de asistencia y excepciones para un ID
router.get('/estadisticas/asistencia/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const client = await pool.connect();
    const fechas = await obtenerTodasLasFechas(client);
    
    let query = 'SELECT ';
    fechas.forEach((fecha, index) => {
      query += `"${fecha}_hora", "${fecha}_excepcion"${index < fechas.length - 1 ? ',' : ''}`;
    });
    query += ` FROM restaurante.registro_general WHERE id = $1`;
    
    const result = await client.query(query, [id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No se encontraron registros para el ID proporcionado" });
    }
    
    const asistencia = fechas.map(fecha => ({
      fecha,
      asistio: result.rows[0][`${fecha}_hora`] !== null,
      excepcion: result.rows[0][`${fecha}_excepcion`]
    })).filter(dia => dia.asistio || dia.excepcion);
    
    res.json(asistencia);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener las estadísticas de asistencia" });
  }
});

// 2. Asistencia y excepción para un ID y fecha específica
router.get('/estadisticas/asistencia/:id/:fecha', async (req, res) => {
  const { id, fecha } = req.params;

  // Cambia el formato de la fecha en la función parse
  console.log("Fecha recibida:", fecha); // Para verificar la fecha que recibes

  if (!isValid(parse(fecha, 'dd-MM-yyyy', new Date()))) { // Cambiar el formato a dd-MM-yyyy
    console.log("Fecha inválida:", fecha);
    return res.status(400).json({ error: "Formato de fecha inválido. Use dd-MM-yyyy" });
  }
  
  try {
    const client = await pool.connect();
    const query = `
      SELECT "${fecha}_hora" as hora, "${fecha}_excepcion" as excepcion
      FROM restaurante.registro_general
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No se encontraron registros para el ID y fecha proporcionados" });
    }
    
    const { hora, excepcion } = result.rows[0];
    res.json({
      fecha,
      asistio: hora !== null,
      hora,
      excepcion
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener la información de asistencia" });
  }
});

// 3. Días de inasistencia para un ID
router.get('/estadisticas/inasistencia/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const client = await pool.connect();
    const fechas = await obtenerTodasLasFechas(client);
    
    let query = 'SELECT ';
    fechas.forEach((fecha, index) => {
      query += `"${fecha}_hora"${index < fechas.length - 1 ? ',' : ''}`;
    });
    query += ` FROM restaurante.registro_general WHERE id = $1`;
    
    const result = await client.query(query, [id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No se encontraron registros para el ID proporcionado" });
    }
    
    const inasistencias = fechas.filter(fecha => result.rows[0][`${fecha}_hora`] === null);
    
    res.json(inasistencias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener las estadísticas de inasistencia" });
  }
});

// 4. Resumen mensual de asistencia
router.get('/estadisticas/resumen-mensual/:id/:mes', async (req, res) => {
  const { id, mes } = req.params;  // Quitamos el año de los parámetros
  
  try {
    const client = await pool.connect();
    const fechas = await obtenerTodasLasFechas(client);  // Obtener todas las fechas disponibles en la DB
    
    // Filtrar las fechas del mes indicado
    const fechasMes = fechas.filter(fecha => {
      const [dia, mesStr] = fecha.split('/');  // Ajustamos para comparar solo con el mes
      return mesStr === mes;  // Filtramos solo por el mes
    });
    
    // Si no hay fechas en el mes, devolvemos un mensaje
    if (fechasMes.length === 0) {
      return res.status(404).json({ message: "No se encontraron registros para el mes proporcionado" });
    }

    // Armamos la consulta con las fechas del mes
    let query = 'SELECT ';
    fechasMes.forEach((fecha, index) => {
      query += `"${fecha}_hora", "${fecha}_excepcion"${index < fechasMes.length - 1 ? ',' : ''}`;
    });
    query += ` FROM restaurante.registro_general WHERE id = $1`;
    
    const result = await client.query(query, [id]);
    client.release();
    
    // Si no se encuentran registros para el ID
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No se encontraron registros para el ID proporcionado" });
    }

    // Inicializamos el resumen y arrays para almacenar detalles específicos de los días
    const resumen = {
      diasAsistidos: 0,
      diasFaltados: 0,
      diasConExcepcion: 0,
      detalles: []  // Agregamos un array para los detalles diarios
    };

    // Procesamos cada día del mes
    fechasMes.forEach(fecha => {
      const asistencia = result.rows[0][`${fecha}_hora`];
      const excepcion = result.rows[0][`${fecha}_excepcion`];
      
      // Si asistió ese día
      if (asistencia !== null) {
        resumen.diasAsistidos++;
      } else {
        resumen.diasFaltados++;
      }

      // Si hubo una excepción
      if (excepcion !== null) {
        resumen.diasConExcepcion++;
      }

      // Agregamos los detalles del día al array
      resumen.detalles.push({
        fecha,
        asistio: asistencia !== null,
        excepcion: excepcion || 'Ninguna'  // Mostrar 'Ninguna' si no hay excepción
      });
    });
    
    res.json(resumen);  // Devolvemos el resumen con los detalles
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el resumen mensual" });
  }
});

// 5. Porcentaje de asistencia en un rango de fechas
router.get('/estadisticas/porcentaje-asistencia/:id/:fechaInicio/:fechaFin', async (req, res) => {
  const { id, fechaInicio, fechaFin } = req.params;
  
  // Validar formato de fecha
  if (!isValid(parse(fechaInicio, 'dd-MM-yyyy', new Date())) || !isValid(parse(fechaFin, 'dd-MM-yyyy', new Date()))) {
    return res.status(400).json({ error: "Formato de fecha inválido. Use dd-MM-yyyy" });
  }
  
  try {
    const client = await pool.connect();
    
    // Crear un rango de fechas
    const fechasRango = eachDayOfInterval({
      start: parse(fechaInicio, 'dd-MM-yyyy', new Date()),
      end: parse(fechaFin, 'dd-MM-yyyy', new Date())
    }).map(date => format(date, 'dd-MM-yyyy'));

    // Obtener las columnas existentes de la tabla
    const columnsResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'registro_general' AND column_name LIKE '%_hora'
    `);

    // Crear una lista con los nombres de columnas existentes en la base de datos
    const columnasExistentes = columnsResult.rows.map(row => row.column_name);

    // Filtrar las fechas del rango que tienen una columna correspondiente en la base de datos
    const fechasValidas = fechasRango.filter(fecha => columnasExistentes.includes(`${fecha}_hora`));

    if (fechasValidas.length === 0) {
      client.release();
      return res.status(404).json({ message: "No se encontraron registros para las fechas proporcionadas" });
    }

    // Crear la consulta SQL solo con las fechas válidas
    let query = 'SELECT ';
    fechasValidas.forEach((fecha, index) => {
      query += `"${fecha}_hora"${index < fechasValidas.length - 1 ? ',' : ''}`;
    });
    query += ` FROM restaurante.registro_general WHERE id = $1`;

    // Ejecutar la consulta
    const result = await client.query(query, [id]);
    client.release();

    // Verificar si no hay resultados
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No se encontraron registros para el ID proporcionado" });
    }

    // Inicializar variables para almacenar los días asistidos y no asistidos
    let diasAsistidos = 0;
    let totalDias = fechasValidas.length;
    let diasAsistidosList = [];
    let diasNoAsistidosList = [];

    // Verificar asistencia en cada fecha válida
    fechasValidas.forEach(fecha => {
      if (result.rows[0][`${fecha}_hora`] !== null) {
        diasAsistidos++;
        diasAsistidosList.push(fecha); // Agregar a la lista de días asistidos
      } else {
        diasNoAsistidosList.push(fecha); // Agregar a la lista de días no asistidos
      }
    });

    // Calcular el porcentaje de asistencia
    const porcentajeAsistencia = (diasAsistidos / totalDias) * 100;

    // Responder con los datos calculados
    res.json({
      porcentajeAsistencia: porcentajeAsistencia.toFixed(2) + '%',
      diasAsistidos,
      diasNoAsistidos: totalDias - diasAsistidos,
      totalDias,
      detalles: {
        diasAsistidos: diasAsistidosList,
        diasNoAsistidos: diasNoAsistidosList
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al calcular el porcentaje de asistencia" });
  }
});

router.get('/estadisticas/asistencia-dia', async (req, res) => {
  let fechaActual = "";
  
  try {
      const { hoy, date } = req.query;
      
      if(hoy === 'true') {
          fechaActual = format(new Date(), 'dd-MM-yyyy');
      } else if(hoy === 'false' && date) {
          const fecha = parse(date, 'dd-MM-yyyy', new Date());
          fechaActual = format(fecha, 'dd-MM-yyyy');
      } else {
          return res.status(400).json({ error: "Fecha inválida" });
      }

      const client = await pool.connect();
      
      const queryEstudiantes = `
          SELECT lg.id, lg.nombre, lg.curso, 
          rg."${fechaActual}_hora" as hora_asistencia, 
          rg."${fechaActual}_excepcion" as excepcion
          FROM restaurante.lista_general lg
          LEFT JOIN restaurante.registro_general rg ON lg.id = rg.id
          WHERE rg."${fechaActual}_hora" IS NOT NULL
          ORDER BY lg.curso, lg.nombre
      `;

      const result = await client.query(queryEstudiantes);
      client.release();

      const estudiantes = result.rows.map(row => ({
          id: row.id,
          name: row.nombre,
          grade: row.curso,
          hora_asistencia: format(parse(row.hora_asistencia, 'HH:mm:ss', new Date()), 'HH:mm:ss'),
          excepcion: row.excepcion
      }));

      res.render('pages/asistencia_dia', {
          title: fechaActual,
          totalAsistencias: result.rows.length,
          estudiantes: estudiantes
      });

  } catch (error) {
      res.render('pages/asistencia_dia', {
          title: fechaActual,
          totalAsistencias: 0,
          estudiantes: []
      });
  }
});

// 7. Estudiantes que asistieron en el mes, organizados por día
router.get('/estadisticas/asistencia-mes', async (req, res) => {
  const mes = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const anio = new Date().getFullYear();

  try {
    const client = await pool.connect();
    
    const queryColumnas = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'restaurante'
      AND table_name = 'registro_general'
      AND column_name LIKE '%-${mes}-${anio}_hora'
      ORDER BY column_name
    `;

    const columnasResult = await client.query(queryColumnas);
    const fechasColumnas = columnasResult.rows.map(row => row.column_name.replace('_hora', ''));

    const asistenciasPorMes = {
      mes: `${mes}-${anio}`,
      totalAsistencias: 0,
      fechas: []
    };

    console.log(columnasResult)

    // Para cada fecha, obtenemos los estudiantes que asistieron
    for (const fecha of fechasColumnas) {
      const queryAsistencia = `
        SELECT lg.id, lg.nombre, lg.curso, 
                rg."${fecha}_hora" as hora_asistencia,
                rg."${fecha}_excepcion" as excepcion
        FROM restaurante.lista_general lg
        LEFT JOIN restaurante.registro_general rg ON lg.id = rg.id
        WHERE rg."${fecha}_hora" IS NOT NULL
        ORDER BY lg.curso, lg.nombre
      `;

      const result = await client.query(queryAsistencia);
      
      if (result.rows.length > 0) {
        // Formatear el resultado para la fecha actual
        const asistenciaFecha = {
          fecha: fecha.replace(/_/g, '-'), // Formateamos la fecha de columna
          asistidos: result.rows.map(row => ({
            id: row.id,
            nombre: row.nombre,
            curso: row.curso,
            hora_asistencia: row.hora_asistencia,
            excepcion: row.excepcion || null
          }))
        };

        // Agregar la asistencia de la fecha al array de fechas
        asistenciasPorMes.fechas.push(asistenciaFecha);
        asistenciasPorMes.totalAsistencias += result.rows.length;
      }
    }

    client.release();

    res.json(asistenciasPorMes);  // Devolvemos el resultado en el formato esperado
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener las asistencias del mes" });
  }
});

module.exports = router;