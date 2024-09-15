const express = require('express');
const router = express.Router();

router.post('/crear_horario', async (req, res) => {
  const { Hora, LunesHora, MartesHora, MiercolesHora, JuevesHora, ViernesHora, nombre } = req.body;

  if (!Hora || !LunesHora || !MartesHora || !MiercolesHora || !JuevesHora || !ViernesHora || !nombre) {
    return res.status(400).json({ success: false, error: "Faltan datos para completar el registro" });
  }

  try {
    const query = `
      INSERT INTO horarios_cursos.${nombre} 
      (Hora, LunesHora, MartesHora, MiercolesHora, JuevesHora, ViernesHora) 
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const values = [Hora, LunesHora, MartesHora, MiercolesHora, JuevesHora, ViernesHora];
    await pool.query(query, values);
    res.json({ success: true, message: "Horario social registrado con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Error al registrar el trabajo social" });
  }
});

router.get('/crear_tabla_cursos', async (req, res) => {
  const profesor = req.query.profesor;
  const curso = req.query.curso;

  if (!profesor || !curso) {
    return res.status(400).json({ success: 0, error: "No se proporcionó un profesor o curso válido" });
  }

  try {
    // Crea la tabla con el nombre del curso proporcionado
    const query = `
      CREATE TABLE IF NOT EXISTS horarios_cursos.${curso} (
        horas VARCHAR(40) NOT NULL,
        Lunes VARCHAR(40) NOT NULL,
        Martes VARCHAR(40) NOT NULL,
        Miercoles VARCHAR(40) NOT NULL,
        Jueves VARCHAR(40) NOT NULL,
        Viernes VARCHAR(40) NOT NULL
      )
    `;

    await pool.query(query);

    // Respuesta de éxito
    res.json({ success: 1, message: `La tabla '${curso}' se creó correctamente.` });
  } catch (err) {
    console.error(err);
    // Respuesta de error
    res.status(500).json({ success: 0, error: `Error al crear la tabla: ${err.message}` });
  }
});

router.post('/delete_horario', async (req, res) => {
  const name = req.query.name;

  if (!name) {
    return res.status(400).json({ success: false, error: "No se proporcionó un cedula válido" });
  }

  try {
    const query = 'DROP TABLE IF EXISTS horarios_curso.$name';
    const result = await pool.query(query, [name]);

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows });
    } else {
      res.status(404).json({ success: false, message: "No se encontraron trabajos sociales para el cedula proporcionado" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/delete_horarios_all', async (req, res) => {
    try {
        const client = await pool.connect();

        // Obtener el nombre de todas las tablas en la base de datos
        const query = `
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'horarios_cursos';
        `;

        const result = await client.query(query);
        const tables = result.rows;

        if (tables.length > 0) {
            // Iterar sobre todas las tablas y eliminarlas
            for (const table of tables) {
                const tableName = table.tablename;
                // Use parameterized query to prevent SQL injection
                const dropQuery = 'DROP TABLE IF EXISTS "horarios_cursos".$1 CASCADE';

                try {
                    await client.query(dropQuery, [tableName]);
                    console.log(`Tabla ${tableName} eliminada exitosamente.`);
                } catch (err) {
                    console.error(`Error al eliminar la tabla ${tableName}: `, err);
                }
            }
            res.send("Tablas eliminadas exitosamente.");
        } else {
            res.send("No se encontraron tablas en la base de datos.");
        }

        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});

router.get('/registro_horario_account', async (req, res) => {
  const name = req.query.name;

  if (!name) {
    return res.status(400).json({ success: false, error: "No se proporcionó un nombre válido" });
  }

  try {
    // Consulta para obtener las tablas que coincidan con el nombre proporcionado
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'horarios_cursos' AND table_name = $1 
      ORDER BY table_name ASC;
    `;
    
    const result = await pool.query(query, [name]);

    if (result.rows.length > 0) {
      // Formateamos los resultados en un array de objetos
      const tables = result.rows.map(row => ({ name: row.table_name }));
      res.json({ success: true, data: tables });
    } else {
      res.status(404).json({ success: false, message: "No hay tablas que coincidan con el nombre proporcionado" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/registro_horario', async (req, res) => {
    try {
        // Conexión a la base de datos
        const client = await pool.connect();

        // Consulta a `information_schema.tables` para obtener todas las tablas en el esquema 'horarios_cursos'
        const query = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'horarios_cursos' 
            ORDER BY table_name ASC;
        `;
        
        const result = await client.query(query);
        
        // Si hay tablas, las devolvemos en un array JSON
        if (result.rows.length > 0) {
            const tables = result.rows.map(row => ({ name: row.table_name }));
            res.json({ success: true, data: tables });
        } else {
            res.status(404).json({ success: false, message: "No hay tablas en el esquema 'horarios_cursos'" });
        }

        // Liberar la conexión
        client.release();
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/ver_horario', async (req, res) => {
    const name = req.query.name;
    if (!name) {
        return res.status(400).json({ success: false, error: "No se proporcionó un nombre válido" });
    }

    // Lista de nombres de tablas permitidos
    const allowedTables = ['horario_1', 'horario_2', 'horario_3']; // Añade aquí los nombres de tablas válidos

    if (!allowedTables.includes(name)) {
        return res.status(400).json({ success: false, error: "Nombre de tabla no válido" });
    }

    try {
        const client = await pool.connect();
        
        // Usamos un nombre de tabla validado
        const query = `
            SELECT * 
            FROM "${name}" 
            ORDER BY CAST(SUBSTRING(horas, 1, POSITION(' - ' IN horas) - 1) AS TIME);
        `;
        
        const result = await client.query(query);
        
        if (result.rows.length > 0) {
            res.json({ success: true, data: result.rows });
        } else {
            res.status(404).json({ success: false, message: "No hay registros en la tabla proporcionada" });
        }
        
        client.release();
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
