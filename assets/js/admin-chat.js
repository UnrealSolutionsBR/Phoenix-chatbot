document.addEventListener("DOMContentLoaded", function () {
    const app = document.getElementById("phoenix-admin-chat-app");
  
    const sessionContainer = document.createElement("div");
    sessionContainer.id = "phoenix-sessions";
    sessionContainer.innerHTML = "<h3>Sesiones activas:</h3>";
  
    const chatContainer = document.createElement("div");
    chatContainer.id = "phoenix-chat-view";
  
    app.innerHTML = '';
    app.appendChild(sessionContainer);
    app.appendChild(chatContainer);
  
    let currentSession = null;
    let lastTimestamp = null;
    let pollingInterval = null;
  
    // 🔁 Obtener sesiones activas desde la base de datos
    fetch(`${PhoenixChatMonitorData.ajaxurl}?action=phoenix_get_sessions`)
      .then(res => res.json())
      .then(res => {
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
  
    // 📥 Cargar historial y activar polling
    function loadSession(sessionId) {
      currentSession = sessionId;
      lastTimestamp = null;
      clearInterval(pollingInterval);
  
      chatContainer.innerHTML = `
        <div id="chat-log" style="height: 400px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; background:#fff;"></div>
        <div>
          <input type="text" id="admin-input" placeholder="Escribe una respuesta..." style="width: 70%;" />
          <button id="send-admin-msg">Enviar</button>
        </div>
      `;
  
      fetch(`${PhoenixChatMonitorData.ajaxurl}?action=phoenix_get_messages&session_id=${sessionId}`)
        .then(res => res.json())
        .then(res => {
          if (res.success && Array.isArray(res.data)) {
            const log = document.getElementById("chat-log");
            log.innerHTML = '';
            res.data.forEach(msg => {
              appendMessageToChat(msg.sender, msg.message);
              lastTimestamp = msg.created_at;
            });
          }
        });
  
      // Evento de envío
      document.getElementById("send-admin-msg").onclick = () => {
        const input = document.getElementById("admin-input");
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
  
      // Activar polling cada 3 segundos
      pollingInterval = setInterval(pollForNewMessages, 3000);
    }
  
    // 🔍 Polling para nuevos mensajes
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
  
    // 🧱 Mostrar mensaje en el log
    function appendMessageToChat(sender, message) {
      const log = document.getElementById("chat-log");
      const div = document.createElement("div");
      div.style.margin = "5px 0";
      div.innerHTML = `<strong>${sender}:</strong> ${message}`;
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
    }
  });
  