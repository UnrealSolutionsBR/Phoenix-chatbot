document.addEventListener('DOMContentLoaded', () => {
    const sessionId = window.phoenixAdminChat.sessionId;
    let lastTimestamp = window.phoenixAdminChat.lastTimestamp;

    function fetchNewMessages() {
        fetch(`${phoenixAdminChat.ajaxurl}?action=phoenix_get_messages&session_id=${sessionId}&after=${lastTimestamp}`)
            .then(res => res.json())
            .then(data => {
                if (!data.success || !Array.isArray(data.data)) return;

                const container = document.getElementById('chat-messages');
                data.data.forEach(msg => {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'message ' + msg.sender;
                    wrapper.innerHTML = `<strong>${capitalize(msg.sender)}:</strong> ${msg.message}<span class="timestamp">${msg.created_at}</span>`;
                    container.appendChild(wrapper);
                    lastTimestamp = Math.max(lastTimestamp, Date.parse(msg.created_at) / 1000);
                });

                container.scrollTop = container.scrollHeight;
            });
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    setInterval(fetchNewMessages, 3000);
});
