"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const websocket_1 = require("./webSocket/websocket");
// Creamos la aplicación de Express.
// Express se encarga de manejar las rutas y peticiones HTTP.
const app = (0, express_1.default)();
// Habilitamos CORS para permitir que el frontend (React),
// que se ejecuta en otro origen/puerto, pueda comunicarse con el backend.
app.use((0, cors_1.default)());
// Permite que Express pueda interpretar los datos enviados
// en formato JSON dentro de las peticiones HTTP.
app.use(express_1.default.json());
// Creamos un servidor HTTP utilizando la aplicación de Express.
// Este servidor será compartido tanto por Express como por WebSocket.
const server = (0, http_1.createServer)(app);
// Inicializamos WebSocket utilizando el mismo servidor HTTP.
// A partir de acá, WebSocket puede manejar las conexiones en tiempo real.
(0, websocket_1.initWebSocket)(server);
// Puerto donde escuchará nuestro servidor.
const PORT = 3000;
// Ponemos el servidor HTTP en funcionamiento.
// "0.0.0.0" permite aceptar conexiones desde otros dispositivos
// de la misma red, por ejemplo nuestro teléfono.
server.listen(PORT, "0.0.0.0", () => {
    console.log("Servidor corriendo...");
});
