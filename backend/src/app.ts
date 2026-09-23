import express from "express";
import cors from "cors";
import { createServer } from "http";
import { initWebSocket } from "./webSocket/websocket";

const app = express();
// Habilitamos CORS para permitir que el frontend (React),
// que se ejecuta en otro origen/puerto, pueda comunicarse con el backend.
app.use(cors());
app.use(express.json());

const server = createServer(app);

initWebSocket(server);

// Puerto donde escuchará nuestro servidor.
const PORT = 3000;


// Ponemos el servidor HTTP en funcionamiento.
// "0.0.0.0" permite aceptar conexiones desde otros dispositivos
// de la misma red, por ejemplo nuestro teléfono.
server.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor corriendo...");
});

