import request from 'supertest';
import { expect } from 'chai';
import app from '../app.js';
import pool from '../config/db.js';

const email = 'e2e@correo.com';
const totalRequests = 50;
const organizacion_id = 'org-test-e2e';

const reservaData = (i) => ({
  profesor: `CargaTest_${i}`,
  clase: `11E2E`,
  lugar: `Sala_${i}`,
  hora_inicio: new Date(Date.now() + (i + 1) * 60000).toISOString(),
  hora_final: new Date(Date.now() + (i + 2) * 60000).toISOString()
});

describe('⚡ Benchmark de escritura de reservas simultáneas', function () {
  this.timeout(10000); // Aumenta el timeout en caso de carga

  let resultados = [];

  it('🚀 Dispara reservas en paralelo y mide tiempos', async () => {
    const startTime = Date.now();

    const promesas = Array.from({ length: totalRequests }, (_, i) =>
      request(app)
        .post(`/reservas/reservar_lugar?email=${email}`)
        .send(reservaData(i))
        .then(res => ({
          success: res.body.success,
          status: res.status,
          time: Date.now() - startTime,
          index: i,
          mensaje: res.body.message || res.body.data || ''
        }))
        .catch(err => ({
          success: false,
          status: 500,
          error: err.message,
          index: i
        }))
    );

    resultados = await Promise.all(promesas);
    const endTime = Date.now();

    const exitosas = resultados.filter(r => r.success);
    const fallidas = resultados.filter(r => !r.success);
    const avgTime = resultados.reduce((sum, r) => sum + r.time, 0) / totalRequests;

    console.log(`\n📊 Benchmark de escritura completado`);
    console.log(`🔁 Total: ${totalRequests}`);
    console.log(`✅ Exitosas: ${exitosas.length}`);
    console.log(`❌ Fallidas: ${fallidas.length}`);
    console.log(`⏱️ Tiempo total: ${endTime - startTime} ms`);
    console.log(`⏳ Tiempo promedio por petición: ${avgTime.toFixed(2)} ms`);

    if (fallidas.length > 0) {
      console.log('\n📉 Detalle de fallos (máx 5):');
      fallidas.slice(0, 5).forEach(f => {
        console.log(`❌ [${f.index}] Status: ${f.status} → ${f.mensaje || f.error}`);
      });
    }

    expect(exitosas.length).to.be.greaterThan(0);
  });

  after(async () => {
    console.log('\n🧽 Limpiando reservas CargaTest_*...');

    try {
      const deleteQuery = `
        DELETE FROM reserva
        WHERE name LIKE 'CargaTest_%' AND organizacion_id = $1
      `;
      const result = await pool.query(deleteQuery, [organizacion_id]);

      console.log(`✅ Eliminadas ${result.rowCount} reservas de prueba.`);
    } catch (err) {
      console.error('❌ Error al eliminar reservas de prueba:', err.message);
    } finally {
      await pool.end();
    }
  });
});
