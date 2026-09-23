import { useEffect, useState, useRef } from "react";
import "./App.css"

// Define la estructura que tendrá cada mensaje del chat.
// Nos permite trabajar con TypeScript y saber qué datos contiene un mensaje.
type ChatMessage = {
  username: string;
  message: string;
};

function App() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // useEffect se ejecuta una vez cuando el componente se monta.
  // Acá establecemos la conexión WebSocket con el backend.
  useEffect(() => {
    const host = window.location.hostname || "localhost";
    const ws = new WebSocket(`ws://${host}:3000`);
    ws.onopen = () => {
      console.log("Conectado al servidor");
    };
    // onMessage: Se ejecuta automáticamente cada vez que el servidor envía un mensaje.
    // Ejemplo: cuando el servidor ejecuta client.send()
    ws.onmessage = (event) => {
      // El servidor envía los datos como JSON.
      // Los convertimos nuevamente en un objeto JavaScript.
      const data = JSON.parse(event.data);
      // Analizamos el tipo de evento para decidir qué hacer.
      switch (data.type) {
        // EVENTO: WELCOME
        case "WELCOME":
          console.log(data.message);
          break;
        // EVENTO: CHAT_MESSAGE
        case "CHAT_MESSAGE":
          setMessages((prev) => [...prev, data]);
          break;
        // EVENTO: USER_JOINED
        case "USER_JOINED":
          setMessages(prev => [
            ...prev,
            {
              username: "Sistema",
              message: `${data.username} se unió al chat`
            }
          ]);
          break;
        // EVENTO: USER_LEFT
        case "USER_LEFT":
          setMessages(prev => [
            ...prev,
            {
              username: "Sistema",
              message: `${data.username} abandonó el chat`
            }
          ]);
          break;
        // EVENTO: USER_LIST
        case "USER_LIST":
          // Actualizamos la lista de usuarios conectados
          // utilizando la información enviada por el servidor.
          setUsers(data.users);
          break;
        // Si recibimos un tipo de evento que todavía no conocemos,
        // simplemente lo mostramos por consola para poder detectarlo.
        default:
          console.log(data.type, data);
      }
    };
    // Guardamos la conexión WebSocket en el estado de React.
    // Esto permite utilizarla posteriormente en otras funciones,
    // como joinChat() o sendMessage().
    setSocket(ws);

    // cuando el componente se desmonta cierro la conexion websocket
    return () => {
      ws.close();
    };
    // El array de dependencias vacío indica que este efecto se ejecuta solamente cuando el componente se monta.
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);

  useEffect(() => {
    if (joined) {
      inputRef.current?.focus();
    }
  }, [joined]);

  // INGRESAR AL CHAT
  function joinChat() {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (username.trim() === "") return;
    // Enviamos al servidor un evento de tipo JOIN.
    socket.send(
      JSON.stringify({
        type: "JOIN",
        username: username
      })
    );
    // Cambiamos el estado para indicar que el usuario ya ingresó al chat.
    // Esto provoca que React muestre la pantalla principal.
    setJoined(true);
  }

  // ENVIAR MENSAJE
  function sendMessage() {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (input.trim() === "") return;
    // Enviamos el evento CHAT_MESSAGE al servidor.
    // El servidor será el encargado de distribuirlo mediante broadcast a los demás clientes.
    socket.send(
      JSON.stringify({
        type: "CHAT_MESSAGE",
        username,
        message: input
      })
    );
    // Limpiamos el input después de enviar el mensaje.
    setInput("");
    inputRef.current?.focus();

  }

  function leaveChat() {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    // le aviso al servidor que abandono el chat
    socket.send(JSON.stringify({ type: "LEAVE" }));
    setJoined(false);
    setMessages([]);
  }

  // PANTALLA DE INGRESO
  if (!joined) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-icon">💬</div>
          <h1>Chat WebSocket</h1>
          <p>Bienvenido al chat en tiempo real</p>
          <input
            type="text"
            ref={inputRef}
            placeholder="Ingresá tu nombre..."
            // El valor del input está controlado por el estado username.
            value={username}
            // Cada vez que el usuario escribe, actualizamos el estado.
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                joinChat();
              }
            }}
          />
          <button onClick={joinChat}>Entrar al chat</button>

        </div>

      </div>

    );
  }

  // PANTALLA PRINCIPAL DEL CHAT
  return (

    <div className="container">
      <div className="chat-container">
        <h1>💬 Chat WebSocket</h1>
        <button className="btn-leave" onClick={leaveChat}> Salir del chat </button>
        <div className="messages">
          {messages.map((m, index) => (
            <p className={m.username === "Sistema" ? "system-message" : "message"} key={index}>
              <strong>{m.username}</strong>: {m.message}
            </p>
          ))}
          <div ref={messagesEndRef}></div>
        </div>
        <div className="input-container">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { sendMessage(); } }}
            placeholder="Escribí un mensaje..."
          />
          <button onClick={sendMessage}>Enviar</button>
        </div>
      </div>
      {/* // LISTA DE USUARIOS */}
      <div className="users-container">
        <h3>Usuarios conectados</h3>
        {users.map((user, index) => (
          <p key={index}> 🟢 {user} {user === username && (<strong> (Tú)</strong>)}</p>
        ))}
      </div>
    </div>
  );
}
export default App;

