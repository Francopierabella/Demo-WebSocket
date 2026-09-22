import express from "express";
import cors from "cors";
import { createServer } from "http";
import { initWebSocket } from "./webSocket/websocket";

// Creamos la aplicación de Express que se encarga de manejar las rutas y peticiones HTTP.
const app = express();
// Habilitamos CORS para permitir que el frontend (React),
// que se ejecuta en otro origen/puerto, pueda comunicarse con el backend.
app.use(cors());
app.use(express.json());

// Creamos un servidor HTTP utilizando la aplicación de Express.
// Este servidor será compartido tanto por Express como por WebSocket.
const server = createServer(app);

// Inicializamos WebSocket utilizando el mismo servidor HTTP.
// A partir de acá, WebSocket puede manejar las conexiones en tiempo real.
initWebSocket(server);

// Puerto donde escuchará nuestro servidor.
const PORT = 3000;


// Ponemos el servidor HTTP en funcionamiento.
// "0.0.0.0" permite aceptar conexiones desde otros dispositivos
// de la misma red, por ejemplo nuestro teléfono.
server.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor corriendo...");
});

