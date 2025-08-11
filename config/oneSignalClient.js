import * as OneSignal from '@onesignal/node-onesignal';
import dotenv from 'dotenv';

// Carga las variables de entorno si aún no lo has hecho en tu app principal
dotenv.config();

/**
 * --- CONFIGURACIÓN CENTRALIZADA DE ONESIGNAL ---
 * Se crea una única instancia del cliente para ser reutilizada en toda la aplicación.
 * Esto asegura consistencia y evita errores de configuración.
 */

// 1. Configuración del Cliente
const configuration = OneSignal.createConfiguration({
  // La autenticación se realiza a través de un Token Provider para mayor seguridad.
  authMethods: {
    app_key: {
      tokenProvider: {
        // Asegúrate de que ONESIGNAL_REST_API_KEY esté en tu archivo .env
        getToken: () => process.env.ONESIGNAL_REST_API_KEY,
      },
    },
  },
});

console.log('Cargando OneSignal con configuration:', configuration);

// 2. Exportación de la instancia del cliente y el App ID
export const oneSignalClient = new OneSignal.DefaultApi(configuration);
export const ONE_SIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
