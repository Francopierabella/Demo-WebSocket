

# 📖 Arquitectura general del proyecto

Antes de hablar de cada archivo, hay que entender cómo fluye la aplicación.

```text
            FRONTEND (React)

                 App.tsx
                     │
                     │ WebSocket
                     │
═════════════════════╪══════════════════════
                     │
             BACKEND (Express)

                 app.ts
                     │
                     ▼

             websocket.ts
                     │
                     ▼

        Todos los clientes conectados
```

Cada archivo tiene una única responsabilidad.

---

# 📄 app.ts

## Responsabilidad

Es el **punto de entrada del backend**.

Su trabajo es crear el servidor HTTP de Express e inicializar el servidor WebSocket.

No contiene lógica del chat.

No procesa mensajes.

Simplemente prepara toda la infraestructura para que la aplicación pueda comenzar a funcionar.

Podemos pensar en él como el "director de orquesta", que organiza todos los componentes antes de que empiece la ejecución.

---

## ¿Qué ocurre cuando se ejecuta?

Cuando ejecutamos:

```bash
npm run dev
```

lo primero que se ejecuta es `app.ts`.

Este archivo realiza, generalmente, los siguientes pasos:

```
Crear Express

↓

Crear servidor HTTP

↓

Inicializar WebSocket

↓

Escuchar conexiones
```

---

## Componentes importantes

### Express

```ts
const app = express();
```

Crea la aplicación web.

Aunque nuestra PoC utiliza WebSockets, seguimos necesitando un servidor HTTP porque la conexión WebSocket comienza mediante una petición HTTP especial llamada **handshake**.

---

### HTTP Server

```ts
const server = createServer(app);
```

Este punto es muy importante.

¿Por qué no usamos simplemente `app.listen()`?

Porque Express crea un servidor HTTP internamente.

Sin embargo, WebSocket necesita acceder directamente a ese servidor para reutilizar la misma conexión.

Por eso utilizamos:

```
HTTP Server

↓

Express

↓

WebSocket
```

Todos trabajan sobre el mismo servidor.

---

### Inicialización del WebSocket

```ts
initWebSocket(server);
```

Aquí delegamos toda la lógica relacionada con WebSockets.

Esto hace que `app.ts` tenga una única responsabilidad:

> Configurar el servidor.

Y no mezclar esa tarea con la lógica del chat.

---

### Escucha del servidor

```ts
server.listen(...)
```

Este es el último paso.

A partir de aquí el servidor queda esperando nuevas conexiones HTTP y WebSocket.

---

# Pregunta típica del profesor

> ¿Por qué no colocaron toda la lógica del chat dentro de `app.ts`?

Respuesta:

Porque seguimos el principio de **separación de responsabilidades**.

`app.ts` únicamente configura el servidor.

Toda la lógica relacionada con WebSockets se encuentra aislada en `websocket.ts`, lo que facilita el mantenimiento y la escalabilidad del proyecto.

---

# 📄 websocket.ts

## Responsabilidad

Este archivo representa el **núcleo de la aplicación**.

Aquí se administra toda la comunicación en tiempo real.

Es el encargado de:

* aceptar nuevos clientes;
* recibir eventos;
* distribuir mensajes;
* mantener la lista de usuarios conectados;
* informar desconexiones.

Si `app.ts` prepara el escenario, `websocket.ts` dirige toda la interacción entre los clientes.

---

## Componentes importantes

### WebSocketServer

```ts
const wss = new WebSocketServer({ server });
```

Este objeto representa el servidor WebSocket.

Su función es escuchar todas las conexiones que llegan desde los navegadores.

---

### Evento connection

```ts
wss.on("connection", ...)
```

Cada vez que un usuario abre la aplicación, el navegador realiza el **handshake** con el servidor.

Cuando ese proceso finaliza correctamente, se dispara este evento.

En ese momento el servidor obtiene un nuevo objeto:

```ts
socket
```

Ese `socket` representa únicamente a ese cliente.

Cada usuario conectado posee su propio socket.

---

### socket.on("message")

```ts
socket.on("message", ...)
```

Aquí el servidor permanece escuchando todo lo que envían los clientes.

No importa si el mensaje corresponde a:

```
JOIN

CHAT_MESSAGE

USER_LEFT
```

Todo llega a este punto.

Posteriormente se analiza el campo:

```ts
type
```

para decidir qué acción ejecutar.

---

### Arquitectura basada en eventos

Este es uno de los conceptos más importantes de WebSockets.

En lugar de enviar simplemente texto, nuestra aplicación envía eventos.

Por ejemplo:

```json
{
    "type":"CHAT_MESSAGE",
    "username":"Franco",
    "message":"Hola"
}
```

El campo `type` permite que el servidor interprete correctamente qué operación debe realizar.

Esto hace que la aplicación sea mucho más escalable.

---

### Broadcast

```ts
wss.clients.forEach(...)
```

El servidor mantiene una colección con todos los clientes conectados.

Cuando llega un mensaje nuevo, recorre esa colección y reenvía el mismo evento a todos los clientes.

Este patrón recibe el nombre de **broadcast**.

Es ampliamente utilizado en:

* chats;
* videojuegos multijugador;
* aplicaciones colaborativas;
* dashboards en tiempo real.

---

### Map de usuarios

```ts
const connectedUsers = new Map(...)
```

Este `Map` permite asociar cada conexión con el nombre del usuario.

Su estructura conceptual es:

```
Socket A → Franco

Socket B → Juan

Socket C → María
```

Gracias a esta asociación el servidor puede saber quién envió cada mensaje y generar la lista de usuarios conectados.

---

### socket.on("close")

Cuando un navegador se desconecta, este evento se ejecuta automáticamente.

El servidor:

* elimina al usuario del `Map`;
* actualiza la lista de usuarios;
* informa al resto de los clientes que ese usuario abandonó el chat.

---

# Pregunta típica del profesor

> ¿Por qué utilizaron un `Map` y no un arreglo?

Respuesta:

Porque cada conexión WebSocket está representada por un objeto `WebSocket`. El `Map` permite asociar directamente ese objeto con el nombre del usuario, facilitando búsquedas, actualizaciones y eliminaciones cuando un cliente se conecta o se desconecta.

---

# 📄 App.tsx

## Responsabilidad

`App.tsx` representa el **cliente** de la aplicación.

Su función es administrar toda la interfaz y mantener la comunicación con el servidor WebSocket.

Mientras `websocket.ts` controla la lógica del servidor, `App.tsx` controla la experiencia del usuario.

---

## Componentes importantes

### useState

```ts
const [messages, setMessages] = useState(...)
```

React utiliza estados para almacenar información dinámica.

Por ejemplo:

* mensajes;
* usuarios conectados;
* nombre del usuario;
* contenido del input.

Cuando alguno de esos estados cambia, React vuelve a renderizar automáticamente la interfaz.

---

### useEffect

El primer `useEffect` establece la conexión WebSocket.

Esto ocurre una sola vez cuando el componente se monta.

Dentro de este efecto también se registran los eventos:

```
onopen

onmessage

onclose
```

que permiten reaccionar ante los distintos eventos enviados por el servidor.

---

### WebSocket

```ts
const ws = new WebSocket(...)
```

Aquí el navegador crea una conexión persistente con el servidor.

A diferencia de HTTP, esta conexión permanece abierta durante toda la sesión, permitiendo enviar y recibir información en cualquier momento sin crear nuevas conexiones.

---

### onmessage

Cada vez que el servidor envía un evento, React lo recibe mediante:

```ts
ws.onmessage
```

Luego analiza el campo:

```ts
type
```

para decidir qué hacer.

Por ejemplo:

```
CHAT_MESSAGE

↓

Agregar mensaje
```

```
USER_LIST

↓

Actualizar usuarios
```

Este comportamiento es muy similar al utilizado en el backend.

---

### joinChat()

Cuando el usuario presiona "Entrar", el cliente envía un evento:

```json
{
    "type":"JOIN"
}
```

El servidor recibe este evento y registra al nuevo usuario.

---

### sendMessage()

Cuando el usuario escribe un mensaje, esta función crea un evento:

```json
{
    "type":"CHAT_MESSAGE"
}
```

y lo envía al servidor mediante:

```ts
socket.send(...)
```

El cliente no envía el mensaje directamente a los demás usuarios.

Siempre pasa por el servidor, que actúa como intermediario y realiza el broadcast.

---

### useRef

En la aplicación utilizamos `useRef` para dos tareas:

* mantener el foco sobre el campo de texto;
* desplazar automáticamente el scroll al último mensaje.

A diferencia de `useState`, `useRef` permite acceder directamente a un elemento del DOM sin provocar un nuevo renderizado del componente.

---

# Pregunta típica del profesor

> ¿Por qué utilizan `useState` para los mensajes y `useRef` para el scroll?

Respuesta:

Porque los mensajes forman parte del estado de la interfaz y, cuando cambian, React debe volver a renderizar el componente. En cambio, la referencia del scroll solo sirve para acceder a un elemento del DOM y no representa información visual que deba provocar un nuevo render.

---
