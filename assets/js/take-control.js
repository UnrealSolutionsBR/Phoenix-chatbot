document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('chat-form');
    const input = document.getElementById('admin_message_input');
    const sessionId = phoenixTakeControl.sessionId;
  
    form.addEventListener('submit', function(e) {
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
        } else {
          alert("Error al enviar mensaje.");
        }
      });
    });
  });
  