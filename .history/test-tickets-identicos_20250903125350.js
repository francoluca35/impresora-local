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

// Datos de prueba para para llevar con brasas (igual a las imágenes)
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
  orden: "1756913083523",
  hora: "12:24",
  fecha: "3/9/2025",
  metodoPago: "efectivo"
};

async function probarParaLlevarBrasas() {
  console.log('\n📦 PROBANDO PARA LLEVAR CON BRASAS...');
  console.log('Cliente:', paraLlevarBrasas.mesa);
  console.log('Productos:', paraLlevarBrasas.productos.map(p => `${p.nombre} (${p.categoria})`).join(', '));
  console.log('Orden:', paraLlevarBrasas.orden);
  console.log('Hora:', paraLlevarBrasas.hora);
  console.log('Fecha:', paraLlevarBrasas.fecha);
  
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
        console.log('🎯 RESULTADO ESPERADO:');
        console.log('  • COCINA: Ticket con "PARA LLEVAR", cliente "franco2", orden, hora, fecha, total');
        console.log('  • PARRILLA: EXACTAMENTE EL MISMO TICKET con "PARA LLEVAR", cliente "franco2", orden, hora, fecha, total');
        console.log('  • Ambos tickets deben ser IDÉNTICOS');
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
  console.log('🧪 INICIANDO PRUEBAS DE TICKETS IDÉNTICOS');
  console.log('=' .repeat(60));
  
  // Verificar que el servidor esté funcionando
  await verificarEstado();
  
  // Probar para llevar con brasas (debe ir a PARRILLA + COCINA con tickets IDÉNTICOS)
  await probarParaLlevarBrasas();
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 PRUEBAS COMPLETADAS');
  console.log('\n📋 COMPORTAMIENTO ESPERADO:');
  console.log('• PARA LLEVAR con brasas → PARRILLA + COCINA');
  console.log('• Ambos tickets deben mostrar "PARA LLEVAR"');
  console.log('• Ambos tickets deben mostrar el cliente "franco2"');
  console.log('• Ambos tickets deben mostrar la misma orden, hora, fecha y total');
  console.log('• Los tickets deben ser EXACTAMENTE IDÉNTICOS');
}

// Ejecutar pruebas
ejecutarPruebas().catch(console.error);
