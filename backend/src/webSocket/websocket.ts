import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";


// Map que relaciona cada conexión WebSocket con el nombre del usuario.
// Nos permite saber qué usuario corresponde a cada socket conectado.
const connectedUsers = new Map<WebSocket, string>();


// Envía la lista actualizada de usuarios a TODOS los clientes conectados.
function broadcastUserList(wss: WebSocketServer) {

    // Obtenemos solamente los nombres almacenados en el Map
    // y los convertimos en un Array para poder enviarlos como JSON.
    const users = Array.from(connectedUsers.values());

    // wss.clients contiene todas las conexiones WebSocket activas.
    wss.clients.forEach((client) => {

        // Solo enviamos el mensaje si la conexión está abierta.
        if (client.readyState === WebSocket.OPEN) {

            // Convertimos el objeto JavaScript a JSON y lo enviamos
            // al cliente. "type" permite identificar qué evento recibió.
            client.send(
                JSON.stringify({
                    type: "USER_LIST",
                    users
                })
            );

        }

    });

}


// Inicializa el servidor WebSocket utilizando el servidor HTTP
// que fue creado previamente en app.ts.
export function initWebSocket(server: Server) {

  // Creamos el servidor WebSocket asociado al servidor HTTP.
  const wss = new WebSocketServer({ server });


  // Este evento se ejecuta cada vez que un nuevo cliente
  // establece una conexión WebSocket.
  wss.on("connection", (socket) => {


    // socket representa únicamente al cliente que acaba de conectarse.
    // Por eso el mensaje de bienvenida se envía solo a él.
    socket.send(
      JSON.stringify({
        type: "WELCOME",
        message: "Bienvenido al chat!",
      })
    );


    // Escuchamos todos los mensajes enviados por este cliente.
    socket.on("message", (raw) => {

      try {

        // El mensaje llega como datos "en bruto". Seria tipo {"username":"Franco","message":"Hola"}
        // Primero lo convertimos a texto y después a un objeto JavaScript.
        const data = JSON.parse(raw.toString());


        // Todos nuestros mensajes tienen un "type" que indica
        // qué acción quiere realizar el cliente.
        switch (data.type) {
          // ------------------------------------------------
          // EVENTO: JOIN
          // ------------------------------------------------
          case "JOIN":
            // Asociamos el socket actual con el nombre del usuario.
            // De esta forma el servidor sabe quién está conectado.
            connectedUsers.set(socket, data.username);

            console.log(`${data.username} se unió al chat`);

            // Avisamos a todos los clientes que un nuevo usuario ingresó.
            wss.clients.forEach((client) => {

                if (client.readyState === WebSocket.OPEN) {

                    client.send(
                        JSON.stringify({
                            type: "USER_JOINED",
                            username: data.username
                        })
                    );

                }

            });

            // Después de agregar al usuario, enviamos la lista
            // actualizada a todos los clientes para mantenerlos sincronizados.
            broadcastUserList(wss);

            break;

          // ------------------------------------------------
          // EVENTO: CHAT_MESSAGE
          // ------------------------------------------------

          case "CHAT_MESSAGE":

            console.log(`${data.username}: ${data.message}`);

            // Los mensajes del chat se envían mediante BROADCAST:
            // todos los clientes conectados reciben el mensaje.
            wss.clients.forEach((client) => {

              if (client.readyState === WebSocket.OPEN) {

                client.send(
                  JSON.stringify({
                    type: "CHAT_MESSAGE",
                    username: data.username,
                    message: data.message,
                  })
                );

              }

            });


            break;


          // Si recibimos un tipo de evento que no conocemos,
          // simplemente lo informamos por consola.
          default:

            console.log("Evento desconocido:", data.type);

        }


      } catch (error) {

        // Si el JSON recibido es inválido o ocurre otro error
        // durante el procesamiento, evitamos que el servidor se caiga.
        console.error("Error al procesar el mensaje:", error);

      }

    });


    // ------------------------------------------------
    // EVENTO: CLOSE
    // ------------------------------------------------

    // Se ejecuta cuando el cliente cierra la conexión,
    // por ejemplo al cerrar la pestaña o abandonar la aplicación.
    socket.on("close", () => {


      // Buscamos qué usuario estaba asociado a este socket.
      const username = connectedUsers.get(socket);


      // Si no encontramos un usuario asociado, no hacemos nada.
      if (!username) return;


      console.log(`${username} abandonó el chat`);


      // Eliminamos la conexión del Map porque el usuario ya no está conectado.
      connectedUsers.delete(socket);


      // Actualizamos la lista de usuarios para todos los clientes.
      broadcastUserList(wss);


      // Avisamos a todos los clientes quién abandonó el chat.
      wss.clients.forEach((client) => {

        if (client.readyState === WebSocket.OPEN) {

          client.send(
            JSON.stringify({

              type: "USER_LEFT",

              username

            })
          );

        }

      });

    });

  });

}

