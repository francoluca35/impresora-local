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
    // Para tickets de para llevar, agregar total
    const total = productos.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);
    ticket += "\n\n";
    ticket += `TOTAL:  $${total} \n`;
  }
  
  ticket += "\n\n";
  ticket += "  ==========================\n";
  ticket += "\n\n\n" + cortar;
  return ticket;
}

// 🧾 Generador de ticket delivery o mostrador
function generarTicketDelivery({ nombre, direccion, productos, total, modo, observacion }) {
  const doble = "\x1D\x21\x11";
  const normal = "\x1D\x21\x00";
  const cortar = "\x1D\x56\x00";
  const tercero = "\x1D\x21\x01";
  const negrita = "\x1B\x45\x01";

  const ahora = new Date();
  const hora = ahora.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const fecha = ahora.toLocaleDateString("es-AR");
  const orden = Math.floor(Math.random() * 1000000000000); // genera orden aleatoria
  const encabezado = modo === "retiro" ? "PARA LLEVAR" : "DELIVERY";

  let ticket = "";
  ticket += doble + `     ${encabezado}\n`;
  ticket += "======================\n";
  ticket += doble;
  ticket += `CLIENTE: ${nombre}\n`;
  if (direccion) ticket += `DIRECCION: ${direccion}\n`;
  ticket += normal;
  ticket += `ORDEN: ${orden}\n`;
  ticket += `HORA: ${hora}\n`;
  ticket += `FECHA: ${fecha}\n`;
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
  ticket += `TOTAL:  $${total} \n`;
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

    // Separar productos por categoría para restaurante
    const parrilla = productos.filter(
      (p) => p.categoria?.toLowerCase() === "brasas"
    );
    const cocina = productos.filter(
      (p) => p.categoria?.toLowerCase() !== "brasas"
    );

    let resultadoParrilla = "Nada que imprimir";
    let resultadoCocina = "Nada que imprimir";

    if (parrilla.length > 0) {
      const ticketParrilla = generarTicketCocina({
        mesa,
        productos: parrilla,
        orden,
        hora,
        fecha,
        metodoPago,
      });
      resultadoParrilla = await imprimirTicket(IP_PARRILLA, ticketParrilla);
    }

    if (cocina.length > 0) {
      const ticketCocina = generarTicketCocina({
        mesa,
        productos: cocina,
        orden,
        hora,
        fecha,
        metodoPago,
      });
      resultadoCocina = await imprimirTicket(IP_COCINA, ticketCocina);
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
    const { nombre, direccion, productos, total, modo, observacion } = req.body;

    // Separar productos por categoría para delivery
    const parrilla = productos.filter(
      (p) => p.categoria?.toLowerCase() === "brasas"
    );
    const cocina = productos.filter(
      (p) => p.categoria?.toLowerCase() !== "brasas"
    );

    let resultadoParrilla = "Nada que imprimir";
    let resultadoCocina = "Nada que imprimir";

    // Para DELIVERY: Productos "brasas" van a AMBAS impresoras
    if (parrilla.length > 0) {
      const ticketParrilla = generarTicketDelivery({
        nombre,
        direccion,
        productos: parrilla,
        total,
        modo,
        observacion,
      });
      
      // Enviar a PARRILLA
      resultadoParrilla = await imprimirTicket(IP_PARRILLA, ticketParrilla);
      
      // TAMBIÉN enviar a COCINA (para delivery, brasas van a ambas)
      await imprimirTicket(IP_COCINA, ticketParrilla);
    }

    // Productos NO "brasas" solo van a COCINA
    if (cocina.length > 0) {
      const ticketCocina = generarTicketDelivery({
        nombre,
        direccion,
        productos: cocina,
        total,
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
