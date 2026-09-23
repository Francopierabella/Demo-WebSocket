import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

const connectedUsers = new Map<WebSocket, string>();

// Función auxiliar reutilizable para enviar un evento a todos los clientes conectados (Broadcast).
function broadcast(wss: WebSocketServer, payload: object) {
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    // Solo enviamos el mensaje si la conexión está abierta.
    if (client.readyState === WebSocket.OPEN) {
      console.log("MESSAGE:", message);
      client.send(message);
    }
  });
}

// Envía la lista actualizada de usuarios a TODOS los clientes conectados.
function broadcastUserList(wss: WebSocketServer) {
  // Obtenemos solamente los nombres almacenados en el Map
  // y los convertimos en un Array para poder enviarlos como JSON.
  const users = Array.from(connectedUsers.values()); // .values() me devuelve el nombre de usurio
  console.log("USUARIOS CONECTADOS", users);
  broadcast(wss, {
    type: "USER_LIST",
    users,
  });
}

function handleUserLeave(socket: WebSocket, wss: WebSocketServer) {
  const username = connectedUsers.get(socket);
  if (!username) return;

  console.log(`${username} abandonó el chat`);
  connectedUsers.delete(socket);

  broadcast(wss, {
    type: "USER_LEFT",
    username,
  });

  broadcastUserList(wss);
}

// Inicializa el servidor WebSocket utilizando el servidor HTTP
// que fue creado previamente en app.ts.
export function initWebSocket(server: Server) {

  const wss = new WebSocketServer({ server });
  // El evento connection se ejecuta cada vez que un navegador establece una conexion WebSocket
  wss.on("connection", (socket) => {
    // socket representa únicamente al cliente que acaba de conectarse.
    // Por eso el mensaje de bienvenida se envía solo a él.
    socket.send(
      JSON.stringify({ type: "WELCOME", message: "Bienvenido al chat!" })
    );

    // Escuchamos todos los mensajes enviados por este cliente.
    socket.on("message", (raw) => {
      try {
        console.log("RAW.toString():", raw.toString());
        const data = JSON.parse(raw.toString());
        console.log("DATA:", data);

        // Todos nuestros mensajes tienen un "type" que indica
        // qué acción quiere realizar el cliente.
        switch (data.type) {
          case "JOIN":
            connectedUsers.set(socket, data.username);
            console.log(`${data.username} se unió al chat`);
            broadcast(wss, {
              type: "USER_JOINED",
              username: data.username,
            });
            broadcastUserList(wss);
            break;
          case "CHAT_MESSAGE":
            console.log(`${data.username}: ${data.message}`);
            const author = connectedUsers.get(socket);
            if (!author) {
              console.warn("Intento de mensaje de un socket no registrado");
              return;
            }
            broadcast(wss, {
              type: "CHAT_MESSAGE",
              username: author,
              message: data.message,
            });
            break;
          case "LEAVE":
            handleUserLeave(socket, wss);
            break;

          default:
            console.log("Evento desconocido:", data.type);
        }
      } catch (error) {
        console.error("Error al procesar el mensaje:", error);
      }
    });

    socket.on("close", () => handleUserLeave(socket, wss));
  });
}
