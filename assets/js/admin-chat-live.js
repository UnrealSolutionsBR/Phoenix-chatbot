jQuery(document).ready(function($) {
    const sessionId = PhoenixChatLiveData.session_id;
    const adminName = PhoenixChatLiveData.admin_name;
    const box = $('#phoenix-admin-chat-live-box');
    const input = $('#phoenix-admin-chat-input');
    const sendBtn = $('#phoenix-admin-send-btn');
    let lastTimestamp = 0;

    function appendMessage(sender, message) {
        const el = $('<div>').addClass('message');
        el.html(`<strong>${sender}:</strong> ${message}`);
        box.append(el);
        box.scrollTop(box.prop("scrollHeight"));
    }

    function fetchMessages() {
        $.get(PhoenixChatLiveData.ajaxurl, {
            action: 'phoenix_get_messages',
            session_id: sessionId,
            since: lastTimestamp
        }, function(res) {
            if (res.success) {
                res.data.forEach(msg => {
                    appendMessage(msg.sender, msg.message);
                    const ts = Date.parse(msg.created_at) / 1000;
                    if (ts > lastTimestamp) lastTimestamp = ts;
                });
            }
        });
    }

    function sendMessage(msg) {
        $.post(PhoenixChatLiveData.ajaxurl, {
            action: 'phoenix_save_message',
            session_id: sessionId,
            sender: 'admin',
            message: msg
        }, function(res) {
            if (res.success) {
                fetchMessages();
                input.val('');
            }
        });
    }

    // Enviar mensaje
    sendBtn.on('click', function() {
        const msg = input.val().trim();
        if (msg !== '') sendMessage(msg);
    });

    input.on('keypress', function(e) {
        if (e.key === 'Enter') sendBtn.click();
    });

    // Marcar que el admin entró al chat (solo una vez al cargar)
    sendMessage(`${adminName} entró al chat`);

    // Iniciar polling
    fetchMessages();
    setInterval(fetchMessages, 3000);
});
