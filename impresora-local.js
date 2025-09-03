const express = require("express");
const cors = require("cors");
const net = require("net");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const IP_COCINA = "192.168.1.100";
const IP_PARRILLA = "192.168.1.101";
const PUERTO = 9100;

// Función para enviar a impresora
function imprimirTicket(ip, contenido) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    
    socket.setTimeout(10000); // 10 segundos de timeout
    
    socket.connect(PUERTO, ip, () => {
      socket.write(contenido, "binary", () => {
        socket.end();
        resolve(`Ticket enviado a ${ip}`);
      });
    });
    
    socket.on("error", (err) => {
      reject(`Error al imprimir en ${ip}: ${err.message}`);
    });
    
    socket.on("timeout", () => {
      socket.destroy();
      reject(`Timeout al conectar con ${ip}`);
    });
  });
}

function generarTicketCocina({
  mesa,
  productos,
  orden,
  hora,
  fecha,
  metodoPago,
  ip,
}) {
  const doble = "\x1D\x21\x11";
  const tercero = "\x1D\x21\x01";
  const normal = "\x1D\x21\x00";
  const cortar = "\x1D\x56\x00";
  const negrita = "\x1B\x45\x01";

  // Detectar si es para llevar (cuando mesa es un nombre y no un número)
  // También considerar que si mesa contiene letras, es un cliente
  const esParaLlevar = (isNaN(mesa) && mesa !== undefined) || 
                       (typeof mesa === 'string' && /[a-zA-Z]/.test(mesa));
  
  const titulo = productos.every((p) => p.categoria?.toLowerCase() === "brasas")
    ? "HORNO"
    : "COCINA";

  let ticket = "";
  
  if (esParaLlevar) {
    // Ticket para llevar
    ticket += doble + `     PARA LLEVAR\n`;
    ticket += "======================\n";
    ticket += doble + `CLIENTE: ${mesa}\n`;
    ticket += normal;
    ticket += `ORDEN: ${orden}\nHORA: ${hora}\nFECHA: ${fecha}\n`;
  } else {
    // Ticket de mesa
    ticket += doble + ` ${titulo}\n`;
    ticket += "======================\n";
    ticket += `MESA: ${mesa}\n`;
    ticket += normal;
    ticket += ` ORDEN: ${orden}\nHORA: ${hora}\nFECHA: ${fecha}\n`;
  }
  
  ticket += doble + "======================\n";

  // Agrupar productos por nombre
  const productosAgrupados = productos.reduce((acc, p) => {
    const nombre = p.nombre.toUpperCase();
    if (!acc[nombre]) {
      acc[nombre] = { ...p, cantidad: p.cantidad || 1 };
    } else {
      acc[nombre].cantidad += p.cantidad || 1;
    }
    return acc;
  }, {});

  // Imprimir productos agrupados
  for (const nombre in productosAgrupados) {
    const item = productosAgrupados[nombre];
    ticket += normal + "cant   producto";
    ticket += "\n";
    ticket += doble + `${item.cantidad} ${nombre}\n`;
    // Observación (si hay)
    if (item.observacion && item.observacion.trim() !== "") {
      ticket += negrita + tercero + `(${item.observacion.trim()})\n`;
    }
    // Adicionales (si hay)
    if (item.adicionales && item.adicionales.length > 0) {
      ticket += normal + ` + ${item.adicionales.join(", ")}\n`;
    }
  }
  
  if (esParaLlevar) {
    // Para tickets de para llevar, NO mostrar precio
    // ticket += "\n\n";
    // ticket += `TOTAL:  $${total.toFixed(2)} \n`;
  }
  
  ticket += "\n\n";
  ticket += "  ==========================\n";
  ticket += "\n\n\n" + cortar;
  return ticket;
}

// 🧾 Generador de ticket delivery o mostrador
function generarTicketDelivery({ nombre, direccion, productos, total, modo, observacion, orden, hora, fecha }) {
  const doble = "\x1D\x21\x11";
  const normal = "\x1D\x21\x00";
  const cortar = "\x1D\x56\x00";
  const tercero = "\x1D\x21\x01";
  const negrita = "\x1B\x45\x01";

  // Usar orden, hora y fecha proporcionados, o generar nuevos si no se proporcionan
  const ahora = new Date();
  const horaFinal = hora || ahora.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const fechaFinal = fecha || ahora.toLocaleDateString("es-AR");
  const ordenFinal = orden || Math.floor(Math.random() * 1000000000000);
  const encabezado = modo === "retiro" ? "PARA LLEVAR" : "DELIVERY";

  let ticket = "";
  ticket += doble + `     ${encabezado}\n`;
  ticket += "======================\n";
  ticket += doble;
  ticket += `CLIENTE: ${nombre}\n`;
  if (direccion) ticket += `DIRECCION: ${direccion}\n`;
  ticket += normal;
  ticket += `ORDEN: ${ordenFinal}\n`;
  ticket += `HORA: ${horaFinal}\n`;
  ticket += `FECHA: ${fechaFinal}\n`;
  ticket += doble + "======================\n";

  // Agrupar productos
  const productosAgrupados = productos.reduce((acc, p) => {
    const nombre = p.nombre.toUpperCase();
    if (!acc[nombre]) {
      acc[nombre] = { ...p, cantidad: p.cantidad || 1 };
    } else {
      acc[nombre].cantidad += p.cantidad || 1;
    }
    return acc;
  }, {});

  ticket += normal + "cant   producto\n";
  for (const nombre in productosAgrupados) {
    const item = productosAgrupados[nombre];
    ticket += doble + `${item.cantidad} ${nombre}\n`;
    // Observación (si hay)
    if (item.observacion && item.observacion.trim() !== "") {
      ticket += negrita + tercero + `(${item.observacion.trim()})\n`;
    }
    // Adicionales (si hay)
    if (item.adicionales && item.adicionales.length > 0) {
      ticket += normal + `   + ${item.adicionales.join(", ")}\n`;
    }
  }
  
  // Observación general del pedido
  if (observacion && observacion.trim() !== "") {
    ticket += "\n";
    ticket += doble + "OBSERVACIÓN GENERAL:\n";
    ticket += normal + `${observacion.trim()}\n`;
  }
  
    ticket += "\n\n";
  // Calcular el total si no se proporciona, o usar el proporcionado
  // SOLO mostrar precio para DELIVERY, NO para "para llevar"
  if (modo !== "retiro") {
    let totalFinal;
    if (total !== null && total !== undefined && total > 0) {
      totalFinal = parseFloat(total) || 0;
    } else {
      // Calcular total internamente sumando precio × cantidad de cada producto
      // Si no hay precio en el producto, usar un precio por defecto o mostrar $0.00
      totalFinal = productos.reduce((acc, p) => {
        const precio = parseFloat(p.precio) || 0;
        const cantidad = parseInt(p.cantidad) || 1;
        const precioTotal = precio * cantidad;
        
        // Si hay adicionales, sumar su costo (asumiendo $200 por adicional)
        let adicionalesCosto = 0;
        if (p.adicionales && p.adicionales.length > 0) {
          adicionalesCosto = p.adicionales.length * 200;
        }
        
        return acc + precioTotal + adicionalesCosto;
      }, 0);
    }
    
    ticket += `TOTAL:  $${totalFinal.toFixed(2)} \n`;
  }
  ticket += doble + "======================\n";
  ticket += normal;
  ticket += "\n\n\n";
  ticket += "==========================\n";
  ticket += cortar;

  return ticket;
}

// 🧾 Generador de ticket para llevar (basado en delivery pero sin precio)
function generarTicketParaLlevar({ nombre, productos, orden, hora, fecha, observacion }) {
  const doble = "\x1D\x21\x11";
  const normal = "\x1D\x21\x00";
  const cortar = "\x1D\x56\x00";
  const tercero = "\x1D\x21\x01";
  const negrita = "\x1B\x45\x01";

  // Usar orden, hora y fecha proporcionados, o generar nuevos si no se proporcionan
  const ahora = new Date();
  const horaFinal = hora || ahora.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const fechaFinal = fecha || ahora.toLocaleDateString("es-AR");
  const ordenFinal = orden || Math.floor(Math.random() * 1000000000000);

  let ticket = "";
  ticket += doble + `     PARA LLEVAR\n`;
  ticket += "======================\n";
  ticket += doble;
  ticket += `CLIENTE: ${nombre}\n`;
  ticket += normal;
  ticket += `ORDEN: ${ordenFinal}\n`;
  ticket += `HORA: ${horaFinal}\n`;
  ticket += `FECHA: ${fechaFinal}\n`;
  ticket += doble + "======================\n";

  // Agrupar productos
  const productosAgrupados = productos.reduce((acc, p) => {
    const nombre = p.nombre.toUpperCase();
    if (!acc[nombre]) {
      acc[nombre] = { ...p, cantidad: p.cantidad || 1 };
    } else {
      acc[nombre].cantidad += p.cantidad || 1;
    }
    return acc;
  }, {});

  ticket += normal + "cant   producto\n";
  for (const nombre in productosAgrupados) {
    const item = productosAgrupados[nombre];
    ticket += doble + `${item.cantidad} ${nombre}\n`;
    // Observación (si hay)
    if (item.observacion && item.observacion.trim() !== "") {
      ticket += negrita + tercero + `(${item.observacion.trim()})\n`;
    }
    // Adicionales (si hay)
    if (item.adicionales && item.adicionales.length > 0) {
      ticket += normal + `   + ${item.adicionales.join(", ")}\n`;
    }
  }  
  
  // Observación general del pedido
  if (observacion && observacion.trim() !== "") {
    ticket += "\n";
    ticket += doble + "OBSERVACIÓN GENERAL:\n";
    ticket += normal + `${observacion.trim()}\n`;
  }
  
  ticket += "\n\n";
  // NO mostrar precio para "para llevar"
  ticket += doble + "======================\n";
  ticket += normal;
  ticket += "\n\n\n";
  ticket += "==========================\n";
  ticket += cortar;

  return ticket;
}

// 📦 Ruta para pedidos restaurante
app.post("/print", async (req, res) => {
  try {
    const { mesa, productos, orden, hora, fecha, metodoPago, ip } = req.body;

    // Si se especifica una IP, enviar solo a esa impresora
    // Nota: 'mesa' puede ser un número (mesa real) o un nombre (cliente para llevar)
    if (ip) {
      // Detectar si es para llevar (cuando mesa es un nombre y no un número)
      // Para "para llevar" desde RestauranteForm, mesa será el nombre del cliente
      const esParaLlevar = (isNaN(mesa) && mesa !== undefined) || 
                           (typeof mesa === 'string' && /[a-zA-Z]/.test(mesa)) ||
                           (typeof mesa === 'string' && mesa.trim().length > 0 && !mesa.match(/^\d+$/));
      
      console.log("🔍 Debug para llevar con IP:", { mesa, tipo: typeof mesa, esParaLlevar, isNaN: isNaN(mesa) });
      
      if (esParaLlevar) {
        // Para "para llevar" con IP específica, usar formato de para llevar
        const ticket = generarTicketParaLlevar({
          nombre: mesa, // Usar el nombre del cliente
          productos: productos,
          orden: orden,
          hora: hora,
          fecha: fecha,
          observacion: null
        });
        
        const resultado = await imprimirTicket(ip, ticket);
        return res.json({
          success: true,
          results: [resultado],
          ip: ip
        });
      } else {
        // Para mesas normales, usar formato de cocina
        const ticket = generarTicketCocina({
          mesa,
          productos,
          orden,
          hora,
          fecha,
          metodoPago,
          ip,
        });
        
        const resultado = await imprimirTicket(ip, ticket);
        return res.json({
          success: true,
          results: [resultado],
          ip: ip
        });
      }
    }

    // Separar productos por categoría para restaurante
    const parrilla = productos.filter(
      (p) => p.categoria?.toLowerCase() === "brasas"
    );
    const cocina = productos.filter(
      (p) => p.categoria?.toLowerCase() !== "brasas"
    );

    let resultadoParrilla = "Nada que imprimir";
    let resultadoCocina = "Nada que imprimir";

    // Detectar si es para llevar (cuando mesa es un nombre y no un número)
    // Para "para llevar" desde RestauranteForm, mesa será el nombre del cliente
    const esParaLlevar = (isNaN(mesa) && mesa !== undefined) || 
                         (typeof mesa === 'string' && /[a-zA-Z]/.test(mesa)) ||
                         (typeof mesa === 'string' && mesa.trim().length > 0 && !mesa.match(/^\d+$/));
    
    console.log("🔍 Debug para llevar:", { mesa, tipo: typeof mesa, esParaLlevar, isNaN: isNaN(mesa) });

    if (parrilla.length > 0) {
      let ticketParaImprimir;
      
        if (esParaLlevar) {
          // Para "para llevar" con brasas: GENERAR TICKET DE PARA LLEVAR para AMBAS IMPRESORAS
          ticketParaImprimir = generarTicketParaLlevar({
            nombre: mesa, // Usar el nombre del cliente
            productos: productos, // TODOS los productos (no solo parrilla)
            orden: orden, // Usar la orden original del pedido
            hora: hora,   // Usar la hora original del pedido
            fecha: fecha, // Usar la fecha original del pedido
            observacion: null
          });
          
          // ENVIAR EL MISMO TICKET DE PARA LLEVAR A AMBAS IMPRESORAS
          resultadoParrilla = await imprimirTicket(IP_PARRILLA, ticketParaImprimir);
          resultadoCocina = await imprimirTicket(IP_COCINA, ticketParaImprimir);
        } else {
          // Para mesas normales, usar generarTicketCocina
          ticketParaImprimir = generarTicketCocina({
            mesa,
            productos: parrilla,
            orden,
            hora,
            fecha,
            metodoPago,
          });
          
          // Solo enviar a PARRILLA para mesas normales
          resultadoParrilla = await imprimirTicket(IP_PARRILLA, ticketParaImprimir);
        }
    }

    if (cocina.length > 0 && !esParaLlevar) {
      // Solo procesar productos de cocina para mesas normales
      // Para "para llevar" con brasas, ya se envió todo en el ticket anterior
      const ticketCocina = generarTicketCocina({
        mesa,
        productos: cocina,
        orden,
        hora,
        fecha,
        metodoPago,
      });
      
      const resultadoCocinaNormal = await imprimirTicket(IP_COCINA, ticketCocina);
      resultadoCocina = resultadoCocinaNormal;
    }

    res.json({
      success: true,
      results: [resultadoParrilla, resultadoCocina],
    });
  } catch (err) {
    res.status(500).json({ error: "Error al imprimir", message: err.message });
  }
});

// 🚚 Ruta para pedidos delivery o mostrador
app.post("/printdelivery", async (req, res) => {
  try {
    const { nombre, direccion, productos, total, modo, observacion, ip } = req.body;

    // Si se especifica una IP específica, enviar solo a esa impresora
    if (ip) {
      const ticket = generarTicketDelivery({
        nombre,
        direccion,
        productos,
        total,
        modo,
        observacion,
      });
      
      const resultado = await imprimirTicket(ip, ticket);
      return res.json({
        success: true,
        results: [resultado],
        ip: ip
      });
    }

    // Separar productos por categoría para delivery
    const parrilla = productos.filter(
      (p) => p.categoria?.toLowerCase() === "brasas"
    );
    const cocina = productos.filter(
      (p) => p.categoria?.toLowerCase() !== "brasas"
    );

    let resultadoParrilla = "Nada que imprimir";
    let resultadoCocina = "Nada que imprimir";

    // Para DELIVERY: Si hay brasas, generar UN SOLO TICKET y enviarlo a AMBAS impresoras
    if (parrilla.length > 0) {
      // Generar UN SOLO TICKET con TODOS los productos
      const ticketParaImprimir = generarTicketDelivery({
        nombre,
        direccion,
        productos: productos, // TODOS los productos (no solo parrilla)
        total: null, // No usar total predefinido, calcularlo internamente
        modo,
        observacion,
      });
      
      // ENVIAR EL MISMO TICKET A AMBAS IMPRESORAS
      resultadoParrilla = await imprimirTicket(IP_PARRILLA, ticketParaImprimir);
      resultadoCocina = await imprimirTicket(IP_COCINA, ticketParaImprimir);
      
    } else if (cocina.length > 0) {
      // Solo productos de cocina (sin brasas) van solo a COCINA
      const ticketCocina = generarTicketDelivery({
        nombre,
        direccion,
        productos: cocina,
        total: null, // No usar total predefinido, calcularlo internamente
        modo,
        observacion,
      });
      resultadoCocina = await imprimirTicket(IP_COCINA, ticketCocina);
    }

    res.json({
      success: true,
      results: [resultadoParrilla, resultadoCocina],
    });
  } catch (err) {
    res.status(500).json({ error: "Error en impresión", message: err.message });
  }
});

// 🖨️ Ruta de estado del servidor
app.get("/status", (req, res) => {
  res.json({
    status: "running",
    timestamp: new Date().toISOString(),
    impresoras: {
      cocina: IP_COCINA,
      parrilla: IP_PARRILLA,
      puerto: PUERTO
    }
  });
});

// 🔄 Ruta para actualización automática (webhook)
app.post("/trigger-update", async (req, res) => {
  try {
    const { timestamp } = req.body;
    console.log(`🔄 Actualización solicitada a las ${timestamp}`);
    
    // Ejecutar git pull
    const { exec } = require('child_process');
    exec('git pull origin main', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error al actualizar:', error);
        return res.status(500).json({ error: error.message });
      }
      
      console.log('✅ Código actualizado:', stdout);
      
      // Reiniciar servidor después de 2 segundos
      setTimeout(() => {
        console.log('🔄 Reiniciando servidor...');
        process.exit(0); // PM2 lo reiniciará automáticamente
      }, 2000);
      
      res.json({ 
        success: true, 
        message: 'Actualización iniciada',
        timestamp: new Date().toISOString()
      });
    });
  } catch (err) {
    console.error('❌ Error en trigger-update:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(
    `🖨️  Servidor local de impresión corriendo en http://localhost:${PORT}`
  );
});

process.on("uncaughtException", (err) => {
  console.error("❌ Excepción no atrapada:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Promesa rechazada no manejada:", reason);
});