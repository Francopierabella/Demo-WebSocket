#### webSocket.ts
## const connectedUsers = new Map<WebSocket, string>(); 

Es la que permite que el servidor sepa qué usuario corresponde a cada conexión WebSocket.
Crea una estructura de datos (Map) donde el servidor guarda la relación entre cada conexión WebSocket y el nombre del usuario que está conectado.
Un Map almacena pares clave → valor.
En nuestro caso:
Clave (WebSocket) → representa la conexión de un cliente.
Valor (string) → representa el nombre del usuario.
Cuando un usuario entra al chat, hacemos algo como: connectedUsers.set(socket, data.username);
Por ejemplo: connectedUsers.set(socket1, "Franco");

El Map queda: socket1 → Franco

Más adelante, si ese mismo usuario envía un mensaje o se desconecta, podemos recuperar su nombre con: const username = connectedUsers.get(socket);

Y el resultado será: "Franco".

Lo hicimos asi porque cada cliente tiene un objeto WebSocket diferente. El servidor conoce perfectamente qué conexión recibió un mensaje, pero no sabe automáticamente el nombre del usuario.
Por eso necesitamos una estructura que diga: "Esta conexion -> Pertenece a -> Franco". Sin este map
cuando un cliente se desconectara, el servidor solo sabria que alguien se desconectó, no quien. 

Posibles preguntas que surgen: 
    Pregunta 1 ¿Por qué utilizaron un Map y no un arreglo (Array)?

        Respuesta: orque un Map permite asociar directamente un objeto WebSocket con el nombre del usuario. Luego podemos buscar, actualizar o eliminar esa asociación de forma sencilla usando el propio objeto socket como clave.

Conclusion: Creamos un Map para asociar cada conexión WebSocket con el nombre del usuario que la utiliza. De esta forma, el servidor puede identificar quién envía un mensaje, mantener la lista de usuarios conectados y detectar correctamente quién se desconecta del chat.

## function broadcastUserList(wss: WebSocketServer)
    Esta función envía a todos los clientes conectados la lista actualizada de usuarios.
    Cada vez que alguien: entra al chat o sale del chat, el servidor ejecuta esta función para que todos los clientes tengan la misma información.

    Recibe el servidor WebSocket (wss) como parámetro, Porque desde él podemos acceder a todos los clientes conectados mediante:  wss.clients

    Obtener la lista de usuarios
        const users = Array.from(connectedUsers.values()); 
        connectedUsers.values() devuelve un iterador. Por eso el uso del Array.from, para trasnformarlo en array
    Luego wss.clients.forEach => recorremos todos los clientes. wss.clients contiene absolutamente todas las conexiones activas.

    if (client.readyState === WebSocket.OPEN) Esto verifica que la conexion siga abierta, osea verificamos que el estado sea OPEN 

    El client.send le envia un mensaje a cada cliente con la lista de usuarios. Es para que todos tengan la misma informacion. De esto se trata el Broadcast, que  significa enviar un mismo mensaje a todos los clientes conectados. En lugar de responder a un único usuario, el servidor distribuye la información a todas las conexiones activas.

## function initWebSocket(server: Server)

    Esta función inicializa el servidor WebSocket y queda esperando que nuevos clientes se conecten.
    Cada vez que un navegador establece una conexión WebSocket con el servidor, se ejecuta el evento "connection" y el servidor puede empezar a comunicarse con ese cliente.
    Básicamente, Es la puerta de entrada de todos los clientes al chat.

    La función recibe un parámetro: server: Server

    Ese server es el servidor HTTP que creamos en app.ts.

    const server = createServer(app);

    initWebSocket(server);
    entonces app.ts crea el servidor http y lo envia a esta funcion para que webSocket utilice ese servidor. Esto es porque WebSocket no trabaja solo, sino que antes de convertirse en una conexión WebSocket, toda comunicación comienza como una petición HTTP especial llamada handshake.

    const wss = new WebSocketServer({ server }); Crea el servidor WebSocket y sera quien administre todas las conexiones. 

    Escuchar conexiones 

    wss.on("connection", (socket) => {
    ...
    })
    Esta línea significa que cada vez que alguien se conecte, ejecuto este código

    La palabra "connection" representa un evento. WebSocket funciona completamente orientado a eventos. Estos podrian ser, "Se conectó un cliente","llegó un mensaje", "Se desconectó un cliente".

    luego tenemos socket.on ...

    ¿Qué es socket? Cuando un cliente se conecta, el servidor recibe automáticamente un objeto: socket

    Ese objeto representa únicamente a ese cliente.

    Cada usuario tiene su propio socket. Eso significa que el servidor puede enviar mensajes solamente a ese cliente: socket.send(...)

    o leer los mensajes que envía: socket.on("message"). 

    Enviar un mensaje de bienvenida con: socket.send

    No usamos wss.clients.forEach(...) ya que queremos enviar el mensaje solamente al cliente que acaba de conectarse. Entonces, el mensaje dentro de socket.send lo envia unicamente al cliente recien conectado. 

#   socket.on("message")

        Esta función queda escuchando todos los mensajes que envían los clientes. Cada vez que un usuario realiza una acción en el frontend, por ejemplo: ingresar al chat, enviar un mensaje

        el frontend ejecuta un: socket.send(...). Ese mensaje llega automáticamente al backend y dispara este evento.
        Es decir, Todo lo que envía el cliente termina llegando aquí. Entonces como funciona? asi. 

        socket.on("message", (raw) => { 
            Cuando un cliente envía cualquier información, el servidor la recibe en la variable: raw. La llamamos "raw" porque significa datos en bruto. Todavía no sabemos qué contiene.
        ese raw es un obj{"type" : "..","username": ".."}
        pasamos con el try. 
        Todo el procesamiento ocurre dentro de un try. Porque si el cliente enviara un mensaje mal formado el programa produciria un error al intentar convertirlo a objeto. 

        const data = JSON.parse(raw.toString()); => convertir el mensaje.

        pasa raw a string (texto) y el JSON.paser lo convierte en obj JavaScript.
        osea es como que raw es lo de antes, el toString me da esto "{}" y el JSON.parse me transforma ese string en { type: ".." , username: ".."} => obj Javascript.
        Gracias a esto podemos acceder ahora si a data.type, data.username, data.message, ...

        llega el switch => switch(data.type). Recordemos que todos nuestros mensajes poseen un campo: type. Ese campo indica qué quiere hacer el cliente. Osea, type = "JOIN" => Ingreso un usuario, type = "CHAT_MESSAGE" => mando un msj, type = "USER_LIST" => Actuaalizar Lista. 
        entonces el switch ve que valor es data.type.
        * Si es JOIN => el siguiente bloque se ejecuta cuando el cliente ingresa al chat. 

        connectedUsers.set(socket, data.username); => guarda el usuario.
        console.log(`${data.username} se unió al chat`); => Muestra por consola
        y el wss.clients.forEach le envia a todos los usuarios conectados el mensaje de que se conecto un nuevo usuario mediante el client.send().
        la funcion:  broadcastUserList(wss);   Me sirve para actualizar la lista de usaurios conectados, se aplica con wss ya que todos deben saber quienes estan conectados.

        * Si es CHAT_MESSAGE => El siguiente bloque se ejecuta cuando alguien envia msj al chat.
        Basicamente lo mismo nada mas que dentro del msj que envia el client.send tmb mandamos el mensaje que envia al chat. 

        
    Entonces como resumen, wss representa todo el servidor webSocket, conoce a todos los clientes y lo usamos para hacer broadcast. En cambio "socket" representa un unico cliente conectado, solo conoce a ese cliente y se usa para comunicacion individual. 

    La función initWebSocket inicializa el servidor WebSocket utilizando el servidor HTTP creado en app.ts. Luego queda escuchando el evento connection, que se dispara cada vez que un cliente establece una nueva conexión. En ese momento se crea un objeto socket que representa exclusivamente a ese cliente, y se le envía un mensaje de bienvenida mediante socket.send(). Elegimos socket.send() porque el mensaje está dirigido únicamente al usuario que acaba de ingresar, mientras que los mensajes destinados a todos los usuarios se envían mediante un broadcast utilizando wss.clients.

## 

