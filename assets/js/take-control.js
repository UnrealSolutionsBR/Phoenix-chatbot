document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('admin_message_input');
  const sessionId = phoenixTakeControl.sessionId;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const message = input.value.trim();
    if (!message) return;

    const now = new Date();
    const created_at = now.toISOString().slice(0, 19).replace('T', ' '); // formato MySQL

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
      console.log("📤 Admin message sent:", data);
      if (data.success) {
        input.value = '';

        // 🟢 Mostrar el mensaje en el chat inmediatamente
        if (typeof renderMessage === 'function') {
          const fakeMsg = {
            sender: 'admin',
            message: message,
            created_at: created_at
          };
          renderMessage(fakeMsg);

          // 🟢 Actualizar el lastTimestamp en global
          if (typeof lastTimestamp !== 'undefined') {
            lastTimestamp = Math.floor(now.getTime() / 1000);
            console.log("⏱️ lastTimestamp actualizado tras enviar:", lastTimestamp);
          }
        }
      } else {
        alert("Error al enviar mensaje.");
      }
    });
  });
});