const express = require('express'); //1271.30ms / 1189.63ms / 
const router = express.Router();
const pool = require('../db.js');
const now = require('performance-now');
const NodeCache = require('node-cache');
const Fuse = require('fuse.js');

// Inicializar el caché
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// GET - Obtener nombres
router.get('/obtener_nombres', async (req, res) => {
  const startTime = now();
  let isCached = false;

  try {
    // Intentar obtener datos del caché
    let result = cache.get("nombres");

    if (result == undefined) {
      // Si no está en caché, consultar la base de datos
      const query = 'SELECT * FROM android_mysql.id2024sql';
      const dbResult = await pool.query(query);
      result = dbResult.rows;

      // Guardar en caché
      cache.set("nombres", result);
    } else {
      isCached = true;
    }

    // Obtener estadísticas del caché
    const cacheStats = cache.getStats();
    const usedCacheSize = cacheStats.keys; // Número de entradas en el caché
    const hits = cacheStats.hits; // Número de veces que se ha usado el caché
    const misses = cacheStats.misses; // Número de veces que no se encontró en el caché

    const endTime = now();
    const duration = (endTime - startTime).toFixed(2);

    if (result.length > 0) {
      res.json({ 
        success: true, 
        data: result, 
        isCached: isCached
        // ,duration: `${duration}ms`,
        // cache: {
        //   totalKeys: usedCacheSize, 
        //   hits: hits, 
        //   misses: misses
        // }
      });
    } else {
      res.json({ 
        success: true, 
        message: "No se encontraron nombres",
        isCached: isCached
        // ,duration: `${duration}ms`,
        // cache: {
        //   totalKeys: usedCacheSize, 
        //   hits: hits, 
        //   misses: misses
        // }
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET - Obtener nombres
router.get('/fuzzy_search', async (req, res) => {
  let isCached = false;

  try {
    const search = req.query.search;

    if (!search) {
      res.status(400).send("El parámetro 'search' es requerido.");
      return;
    }

    // Intentar obtener datos del caché
    let result = cache.get("nombres");

    if (result == undefined) {
      // Si no está en caché, consultar la base de datos
      const query = 'SELECT * FROM android_mysql.id2024sql';
      const dbResult = await pool.query(query);
      result = dbResult.rows;

      // Guardar en caché
      cache.set("nombres", result);
    } else {
      isCached = true;
    }

    if (result.length > 0) {
      // Configuración de Fuse para la búsqueda fuzzy
      const fuseOptions = {
        includeScore: true,
        threshold: 0.4,
        keys: [
          "nombre"
        ]
      };

      // Crear instancia de Fuse con los datos y opciones
      const fuse = new Fuse(result, fuseOptions);

      // Realizar búsqueda fuzzy
      const searchResults = fuse.search(search);

      // Extraer solo los items (sin las puntuaciones)
      const matchedItems = searchResults.map(result => result.item);

      res.json({ 
        success: true, 
        data: matchedItems, 
        isCached: isCached,
        totalResults: matchedItems.length
      });
    } else {
      res.json({ 
        success: true, 
        message: "No se encontraron nombres",
        isCached: isCached
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
