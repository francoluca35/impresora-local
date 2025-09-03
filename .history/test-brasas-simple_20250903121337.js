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

// Datos de prueba para delivery con brasas
const deliveryBrasas = {
  nombre: "Juan Pérez",
  direccion: "Av. San Martín 123",
  productos: [
    {
      nombre: "Pollo a la brasa",
      categoria: "brasas",
      cantidad: 2,
      precio: 25.50,
      observacion: "Bien dorado"
    },
    {
      nombre: "Costilla de cerdo",
      categoria: "brasas", 
      cantidad: 1,
      precio: 30.00,
      observacion: "Sin grasa"
    }
  ],
  total: 81.00,
  modo: "delivery",
  observacion: "Entregar en puerta principal"
};

// Datos de prueba para para llevar con brasas
const paraLlevarBrasas = {
  mesa: "María González", // Nombre en lugar de número = para llevar
  productos: [
    {
      nombre: "Pollo a la brasa",
      categoria: "brasas",
      cantidad: 1,
      precio: 25.50,
      observacion: "Extra crujiente"
    },
    {
      nombre: "Ensalada César",
      categoria: "ensaladas",
      cantidad: 1,
      precio: 15.00
    }
  ],
  orden: "TL-001",
  hora: "14:30",
  fecha: "15/12/2024",
  metodoPago: "efectivo"
};

// Datos de prueba para mesa normal (solo cocina)
const mesaNormal = {
  mesa: 5, // Número = mesa real
  productos: [
    {
      nombre: "Pasta Carbonara",
      categoria: "pastas",
      cantidad: 2,
      precio: 18.00
    }
  ],
  orden: "M-005",
  hora: "20:15",
  fecha: "15/12/2024",
  metodoPago: "tarjeta"
};

async function probarDeliveryBrasas() {
  console.log('\n🔥 PROBANDO DELIVERY CON BRASAS...');
  console.log('Productos:', deliveryBrasas.productos.map(p => `${p.nombre} (${p.categoria})`).join(', '));
  
  try {
    const response = await hacerPeticion('POST', '/printdelivery', deliveryBrasas);
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
    }
  } catch (error) {
    console.error('❌ Error en delivery:', error.message);
  }
}

async function probarParaLlevarBrasas() {
  console.log('\n📦 PROBANDO PARA LLEVAR CON BRASAS...');
  console.log('Productos:', paraLlevarBrasas.productos.map(p => `${p.nombre} (${p.categoria})`).join(', '));
  console.log('Mesa:', paraLlevarBrasas.mesa, '(nombre = para llevar)');
  
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
    }
  } catch (error) {
    console.error('❌ Error en para llevar:', error.message);
  }
}

async function probarMesaNormal() {
  console.log('\n🍽️ PROBANDO MESA NORMAL (SOLO COCINA)...');
  console.log('Productos:', mesaNormal.productos.map(p => `${p.nombre} (${p.categoria})`).join(', '));
  console.log('Mesa:', mesaNormal.mesa, '(número = mesa real)');
  
  try {
    const response = await hacerPeticion('POST', '/print', mesaNormal);
    console.log('✅ Respuesta:', response);
    
    if (response.results) {
      console.log('📋 Resultados:');
      response.results.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result}`);
      });
      
      // Verificar que solo vaya a cocina
      const tieneParrilla = response.results.some(r => r.includes('PARRILLA') || r.includes('192.168.1.101'));
      const tieneCocina = response.results.some(r => r.includes('COCINA') || r.includes('192.168.1.100'));
      
      console.log('🔍 Verificación:');
      console.log(`  • ¿Fue a PARRILLA? ${tieneParrilla ? '❌ NO DEBERÍA' : '✅ CORRECTO'}`);
      console.log(`  • ¿Fue a COCINA? ${tieneCocina ? '✅ SÍ' : '❌ NO'}`);
      console.log(`  • ¿Solo a cocina? ${!tieneParrilla && tieneCocina ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
    }
  } catch (error) {
    console.error('❌ Error en mesa normal:', error.message);
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
  console.log('🧪 INICIANDO PRUEBAS DE IMPRESIÓN DE BRASAS');
  console.log('=' .repeat(50));
  
  // Verificar que el servidor esté funcionando
  await verificarEstado();
  
  // Probar delivery con brasas (debe ir a PARRILLA + COCINA)
  await probarDeliveryBrasas();
  
  // Probar para llevar con brasas (debe ir a PARRILLA + COCINA)
  await probarParaLlevarBrasas();
  
  // Probar mesa normal (debe ir solo a COCINA)
  await probarMesaNormal();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 PRUEBAS COMPLETADAS');
  console.log('\n📋 RESUMEN DE COMPORTAMIENTO ESPERADO:');
  console.log('• DELIVERY con brasas → PARRILLA + COCINA');
  console.log('• PARA LLEVAR con brasas → PARRILLA + COCINA');
  console.log('• MESA normal → Solo COCINA');
}

// Ejecutar pruebas
ejecutarPruebas().catch(console.error);
