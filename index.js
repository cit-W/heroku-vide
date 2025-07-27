import app from './app.js';
import { refreshMaterializedViews } from './config/db_maintenance.js';

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);

  // Iniciar el refresco de vistas materializadas y repetirlo cada 15 minutos
  refreshMaterializedViews(); // Ejecutar una vez al iniciar
  setInterval(refreshMaterializedViews, 15 * 60 * 1000); // 15 minutos
});