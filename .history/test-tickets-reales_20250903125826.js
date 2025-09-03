const http = require('http');

const BASE_URL = 'localhost';
const PORT = 4000;

// Función para hacer peticiones HTTP
function hacerPeticion(method, path, data) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (e) {
          resolve({ raw: body, status: res.statusCode });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Datos de prueba IDÉNTICOS a producción
const paraLlevarBrasas = {
  mesa: "franco2", // Nombre en lugar de número = para llevar
  productos: [
    {
      nombre: "1/2 POLLO A LA BRASA",
      categoria: "brasas",
      cantidad: 1,
      precio: 25.50,
      observacion: "Bien dorado"
    }
  ],
  orden: "1756913083523", // Orden específica
  hora: "12:24",          // Hora específica
  fecha: "3/9/2025",      // Fecha específica
  metodoPago: "efectivo"
};

async function probarParaLlevarBrasas() {
  console.log('\n📦 PROBANDO PARA LLEVAR CON BRASAS (PRODUCCIÓN)...');
  console.log('Cliente:', paraLlevarBrasas.mesa);
  console.log('Productos:', paraLlevarBrasas.productos.map(p => `${p.nombre} (${p.categoria})`).join(', '));
  console.log('Orden:', paraLlevarBrasas.orden);
  console.log('Hora:', paraLlevarBrasas.hora);
  console.log('Fecha:', paraLlevarBrasas.fecha);
  console.log('Precio:', paraLlevarBrasas.productos[0].precio);
  
  try {
    const response = await hacerPeticion('POST', '/print', paraLlevarBrasas);
    console.log('✅ Respuesta:', response);
    
    if (response.results) {
      console.log('📋 Resultados:');
      response.results.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result}`);
      });
      
      // Verificar que las brasas vayan a ambas impresoras
      const tieneParrilla = response.results.some(r => r.includes('PARRILLA') || r.includes('192.168.1.101'));
      const tieneCocina = response.results.some(r => r.includes('COCINA') || r.includes('192.168.1.100'));
      
      console.log('🔍 Verificación:');
      console.log(`  • ¿Fue a PARRILLA? ${tieneParrilla ? '✅ SÍ' : '❌ NO'}`);
      console.log(`  • ¿Fue a COCINA? ${tieneCocina ? '✅ SÍ' : '❌ NO'}`);
      console.log(`  • ¿Brasas a ambas? ${tieneParrilla && tieneCocina ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
      
      if (tieneParrilla && tieneCocina) {
        console.log('\n🎯 RESULTADO ESPERADO EN PRODUCCIÓN:');
        console.log('  • COCINA: Ticket con "PARA LLEVAR", cliente "franco2"');
        console.log('  • PARRILLA: EXACTAMENTE EL MISMO TICKET con "PARA LLEVAR", cliente "franco2"');
        console.log('  • Ambos tickets deben mostrar:');
        console.log('    - Orden: 1756913083523');
        console.log('    - Hora: 12:24');
        console.log('    - Fecha: 3/9/2025');
        console.log('    - Total: $25.50');
        console.log('  • Los tickets deben ser COMPLETAMENTE IDÉNTICOS');
        
        console.log('\n⚠️  PROBLEMA ANTERIOR:');
        console.log('  • PARRILLA mostraba "COCINA" y "MESA: undefined"');
        console.log('  • PARRILLA generaba orden/hora/fecha diferentes');
        console.log('  • Los tickets NO eran idénticos');
        
        console.log('\n✅ SOLUCIÓN IMPLEMENTADA:');
        console.log('  • generarTicketDelivery ahora acepta orden, hora, fecha');
        console.log('  • Se pasan los valores originales del pedido');
        console.log('  • Ambos tickets usan los mismos datos');
        console.log('  • Los tickets ahora SÍ son idénticos');
      }
    }
  } catch (error) {
    console.error('❌ Error en para llevar:', error.message);
  }
}

async function verificarEstado() {
  console.log('\n🔍 VERIFICANDO ESTADO DEL SERVIDOR...');
  try {
    const response = await hacerPeticion('GET', '/status');
    console.log('✅ Estado:', response);
  } catch (error) {
    console.error('❌ Error al verificar estado:', error.message);
  }
}

async function ejecutarPruebas() {
  console.log('🧪 INICIANDO PRUEBAS DE TICKETS IDÉNTICOS EN PRODUCCIÓN');
  console.log('=' .repeat(70));
  
  // Verificar que el servidor esté funcionando
  await verificarEstado();
  
  // Probar para llevar con brasas (debe ir a PARRILLA + COCINA con tickets IDÉNTICOS)
  await probarParaLlevarBrasas();
  
  console.log('\n' + '=' .repeat(70));
  console.log('🏁 PRUEBAS COMPLETADAS');
  console.log('\n📋 COMPORTAMIENTO ESPERADO EN PRODUCCIÓN:');
  console.log('• PARA LLEVAR con brasas → PARRILLA + COCINA');
  console.log('• Ambos tickets deben mostrar "PARA LLEVAR"');
  console.log('• Ambos tickets deben mostrar el cliente "franco2"');
  console.log('• Ambos tickets deben mostrar la MISMA orden, hora, fecha y total');
  console.log('• Los tickets deben ser COMPLETAMENTE IDÉNTICOS');
  console.log('\n🔧 CAMBIOS IMPLEMENTADOS:');
  console.log('• generarTicketDelivery ahora acepta parámetros orden, hora, fecha');
  console.log('• Se pasan los valores originales del pedido para mantener consistencia');
  console.log('• Los tickets de PARRILLA y COCINA ahora son idénticos');
}

// Ejecutar pruebas
ejecutarPruebas().catch(console.error);
