document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('admin_message_input');
  const sessionId = phoenixTakeControl.sessionId;
  const adminName = phoenixTakeControl.adminName;
  const chatContainer = document.getElementById('chat-messages');
  let lastId = 0;

  // Obtener el último ID actual en el historial
  const allMessages = chatContainer.querySelectorAll('.message');
  if (allMessages.length > 0) {
    const lastMsg = allMessages[allMessages.length - 1];
    lastId = parseInt(lastMsg.dataset.id) || 0;
  }

  // Función para renderizar un mensaje en el DOM
  function renderMessage(msg) {
    const div = document.createElement('div');
    div.className = 'message ' + msg.sender;
    div.dataset.id = msg.id;
    div.innerHTML = `<strong>${capitalize(msg.sender)}:</strong> ${escapeHtml(msg.message)}
      <span class="timestamp">${formatDate(msg.created_at)}</span>`;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Envío del mensaje por AJAX
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const message = input.value.trim();
    if (!message) return;

    fetch(phoenixTakeControl.ajaxurl, {
      method: "POST",
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        action: 'phoenix_send_admin_message',
        session_id: sessionId,
        message: message
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        input.value = '';
        renderMessage(data);
        lastId = data.id;
      } else {
        alert("Error al enviar mensaje.");
      }
    });
  });

  // Polling cada 3 segundos
  setInterval(() => {
    fetch(`${phoenixTakeControl.ajaxurl}?action=phoenix_poll_messages&session_id=${sessionId}&after_id=${lastId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          data.data.forEach(msg => {
            renderMessage(msg);
            lastId = msg.id;
          });
        }
      });
  }, 3000);

  // Función: Formatear fecha y hora
  function formatDate(datetime) {
    const date = new Date(datetime);
    return date.toLocaleString('es-ES', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  }

  // Función: Escapar HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Función: Capitalizar
  function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
});

// 🔴 Registrar mensaje al salir del chat (antes deunload)
window.addEventListener('beforeunload', () => {
  if (phoenixTakeControl && phoenixTakeControl.sessionId && phoenixTakeControl.adminName) {
    navigator.sendBeacon(phoenixTakeControl.ajaxurl, new URLSearchParams({
      action: 'phoenix_send_admin_message',
      session_id: phoenixTakeControl.sessionId,
      message: `${phoenixTakeControl.adminName} salió del chat`
    }));
  }
});