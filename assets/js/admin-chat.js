document.addEventListener("DOMContentLoaded", function () {
  console.log("Phoenix admin JS cargado ✅");

  const app = document.getElementById("phoenix-admin-chat-app");
  const selectedSession = app?.dataset?.session || null;

  console.log("Elemento app:", app);
  console.log("selectedSession:", selectedSession);

  const sessionContainer = document.createElement("div");
  sessionContainer.id = "phoenix-sessions";
  sessionContainer.innerHTML = "<h3>Sesiones activas:</h3>";

  const chatContainer = document.createElement("div");
  chatContainer.id = "phoenix-chat-view";

  app.innerHTML = '';
  if (!selectedSession) {
    app.appendChild(sessionContainer);
  }
  app.appendChild(chatContainer);

  let currentSession = null;
  let lastTimestamp = null;
  let pollingInterval = null;

  if (!selectedSession) {
    console.log("Modo normal: cargando lista de sesiones");
    fetch(`${PhoenixChatMonitorData.ajaxurl}?action=phoenix_get_sessions`)
      .then(res => res.json())
      .then(res => {
        console.log("Sesiones recibidas:", res);
        if (res.success && Array.isArray(res.data)) {
          res.data.forEach(session => {
            const btn = document.createElement("button");
            btn.textContent = `Sesión: ${session.session_id}`;
            btn.style.marginRight = "8px";
            btn.onclick = () => loadSession(session.session_id);
            sessionContainer.appendChild(btn);
          });
        }
      });
  } else {
    console.log("Modo directo: cargando sesión", selectedSession);
    loadSession(selectedSession);
  }

  function loadSession(sessionId) {
    console.log("Llamando loadSession:", sessionId);
    currentSession = sessionId;
    lastTimestamp = null;
    clearInterval(pollingInterval);
    chatContainer.innerHTML = '';

    chatContainer.innerHTML = `
      <div style="margin-bottom: 16px;">
        <strong>Conversación de sesión:</strong> ${sessionId}
      </div>
      <div id="chat-log" style="height: 400px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; background:#fff;"></div>
      <div>
        <input type="text" id="admin-input" placeholder="Escribe una respuesta..." style="width: 70%;" />
        <button id="send-admin-msg">Enviar</button>
      </div>
    `;

    fetch(`${PhoenixChatMonitorData.ajaxurl}?action=phoenix_get_messages&session_id=${sessionId}`)
      .then(res => res.json())
      .then(res => {
        console.log("Respuesta de phoenix_get_messages:", res);
        if (res.success && Array.isArray(res.data)) {
          const log = document.getElementById("chat-log");
          if (!log) {
            console.warn("❌ No se encontró #chat-log");
            return;
          }

          log.innerHTML = '';
          res.data.forEach(msg => {
            appendMessageToChat(msg.sender, msg.message);
            lastTimestamp = msg.created_at;
          });
        } else {
          console.warn("No se pudo obtener historial de mensajes");
        }
      });

    const sendBtn = document.getElementById("send-admin-msg");
    const input = document.getElementById("admin-input");

    sendBtn.onclick = () => {
      const message = input.value.trim();
      if (!message) return;

      fetch(PhoenixChatMonitorData.ajaxurl, {
        method: "POST",
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'phoenix_save_message',
          session_id: sessionId,
          sender: 'admin',
          message: message
        })
      });

      appendMessageToChat("admin", message);
      input.value = '';
    };

    pollingInterval = setInterval(pollForNewMessages, 3000);
  }

  function pollForNewMessages() {
    if (!currentSession) return;

    let url = `${PhoenixChatMonitorData.ajaxurl}?action=phoenix_get_messages&session_id=${currentSession}`;
    if (lastTimestamp) {
      url += `&after=${encodeURIComponent(lastTimestamp)}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(res => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          res.data.forEach(msg => {
            appendMessageToChat(msg.sender, msg.message);
            lastTimestamp = msg.created_at;
          });
        }
      });
  }

  function appendMessageToChat(sender, message) {
    const log = document.getElementById("chat-log");
    if (!log) {
      console.warn("No se encontró el contenedor del historial");
      return;
    }

    const div = document.createElement("div");
    div.style.margin = "5px 0";
    div.innerHTML = `<strong>${sender}:</strong> ${message}`;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }
});
