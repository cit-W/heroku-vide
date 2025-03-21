import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = `http://localhost:${process.env.PORT || 5002}/reservas/verificar_reserva`;
const email = 'e2e@correo.com'; // Usa el correo que ya tienes en tus pruebas
const totalRequests = 50;

const reservaData = {
  profesor: 'CargaTest',
  clase: '11E2E',
  lugar: 'Sala Carga',
  hora_inicio: new Date(Date.now() + 5 * 60000).toISOString(),
  hora_final: new Date(Date.now() + 30 * 60000).toISOString(),
};

async function sendRequest(i) {
  const t0 = Date.now();
  try {
    const res = await fetch(`${BASE_URL}?email=${email}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservaData),
    });

    const data = await res.json();
    const t1 = Date.now();
    return {
      status: res.status,
      success: data.success,
      time: t1 - t0
    };
  } catch (error) {
    return {
      status: 500,
      success: false,
      time: 0,
      error: error.message
    };
  }
}

async function benchmark() {
  console.log(`🚀 Iniciando benchmark de ${totalRequests} peticiones paralelas...`);

  const startTime = Date.now();
  const results = await Promise.all(Array.from({ length: totalRequests }, (_, i) => sendRequest(i)));
  const endTime = Date.now();

  const success = results.filter(r => r.success).length;
  const failed = totalRequests - success;
  const avgTime = results.reduce((sum, r) => sum + r.time, 0) / totalRequests;

  console.log(`\n📊 Resultados del benchmark:`);
  console.log(`🔁 Total de peticiones: ${totalRequests}`);
  console.log(`✅ Éxito: ${success}`);
  console.log(`❌ Fallidas: ${failed}`);
  console.log(`⏱️ Tiempo total: ${endTime - startTime} ms`);
  console.log(`⏳ Tiempo promedio por petición: ${avgTime.toFixed(2)} ms`);
}

benchmark();