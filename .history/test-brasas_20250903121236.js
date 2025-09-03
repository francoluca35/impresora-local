const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

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
    const response = await axios.post(`${BASE_URL}/printdelivery`, deliveryBrasas);
    console.log('✅ Respuesta:', response.data);
    
    if (response.data.results) {
      console.log('📋 Resultados:');
      response.data.results.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result}`);
      });
    }
  } catch (error) {
    console.error('❌ Error en delivery:', error.response?.data || error.message);
  }
}

async function probarParaLlevarBrasas() {
  console.log('\n📦 PROBANDO PARA LLEVAR CON BRASAS...');
  console.log('Productos:', paraLlevarBrasas.productos.map(p => `${p.nombre} (${p.categoria})`).join(', '));
  console.log('Mesa:', paraLlevarBrasas.mesa, '(nombre = para llevar)');
  
  try {
    const response = await axios.post(`${BASE_URL}/print`, paraLlevarBrasas);
    console.log('✅ Respuesta:', response.data);
    
    if (response.data.results) {
      console.log('📋 Resultados:');
      response.data.results.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result}`);
      });
    }
  } catch (error) {
    console.error('❌ Error en para llevar:', error.response?.data || error.message);
  }
}

async function probarMesaNormal() {
  console.log('\n🍽️ PROBANDO MESA NORMAL (SOLO COCINA)...');
  console.log('Productos:', mesaNormal.productos.map(p => `${p.nombre} (${p.categoria})`).join(', '));
  console.log('Mesa:', mesaNormal.mesa, '(número = mesa real)');
  
  try {
    const response = await axios.post(`${BASE_URL}/print`, mesaNormal);
    console.log('✅ Respuesta:', response.data);
    
    if (response.data.results) {
      console.log('📋 Resultados:');
      response.data.results.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result}`);
      });
    }
  } catch (error) {
    console.error('❌ Error en mesa normal:', error.response?.data || error.message);
  }
}

async function verificarEstado() {
  console.log('\n🔍 VERIFICANDO ESTADO DEL SERVIDOR...');
  try {
    const response = await axios.get(`${BASE_URL}/status`);
    console.log('✅ Estado:', response.data);
  } catch (error) {
    console.error('❌ Error al verificar estado:', error.response?.data || error.message);
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
