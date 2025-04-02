const phoenixChatbotBaseUrl = phoenixChatbotBaseUrlData.baseUrl;

const phoenixAssistants = [
    { name: "Valeria", avatar: phoenixChatbotBaseUrl + "assets/img/Valeria.png" },
    { name: "Andrés", avatar: phoenixChatbotBaseUrl + "assets/img/Andres.png" },
    { name: "Camila", avatar: phoenixChatbotBaseUrl + "assets/img/Camila.png" },
    { name: "Renata", avatar: phoenixChatbotBaseUrl + "assets/img/Renata.png" },
    { name: "Esteban", avatar: phoenixChatbotBaseUrl + "assets/img/Esteban.png" }
];

const activeAssistant = phoenixAssistants[Math.floor(Math.random() * phoenixAssistants.length)];
let botMessageTimes = [];

let phoenixConversationHistory = [
    {
        role: 'system',
        content: `Eres el asistente virtual de Unreal Solutions, una agencia creativa especializada en desarrollo web, edición de video y marketing digital. Atiendes exclusivamente a clientes interesados en nuestros servicios: desarrollo de sitios web (especialmente en WordPress), producción audiovisual, estrategias de marketing (SEO, redes sociales, campañas pagadas). Tu tono es cercano, profesional y parte del equipo, usando frases como 'En Unreal Solutions te ayudamos a...'.

⚠️ Si un usuario te pide información que no se relaciona con estos servicios, educadamente rechaza diciendo que estás enfocado en ayudar dentro del alcance de Unreal Solutions.

Tu misión es entender al cliente y ofrecerle soluciones dentro de nuestras especialidades. Si es necesario, sugiere agendar una reunión con nuestro equipo. Sé claro, útil y evita sonar como un robot.`
    }
];

document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('phoenix-user-input');
    const sendBtn = document.getElementById('phoenix-send-btn');
    const messages = document.getElementById('phoenix-chat-messages');
    const loader = document.getElementById('phoenix-loader');
    const chatbot = document.querySelector('.phoenix-chatbot-container');

    function appendMessage(text, sender) {
        const msgWrapper = document.createElement('div');
        msgWrapper.className = 'phoenix-message ' + sender;

        if (sender === 'bot') {
            const avatar = document.createElement('img');
            avatar.src = activeAssistant.avatar;
            avatar.alt = activeAssistant.name;
            avatar.className = 'phoenix-bot-avatar';

            const bubble = document.createElement('div');
            bubble.className = 'phoenix-message-content';

            const meta = document.createElement('div');
            meta.className = 'phoenix-message-meta';
            const timestamp = new Date();
            meta.dataset.timestamp = timestamp.getTime();
            meta.textContent = `${activeAssistant.name} • Hace 1 min`;

            botMessageTimes.push({ meta, timestamp });

            const textNode = document.createElement('div');
            textNode.textContent = text;

            bubble.appendChild(meta);
            bubble.appendChild(textNode);
            msgWrapper.appendChild(avatar);
            msgWrapper.appendChild(bubble);
        } else {
            const bubble = document.createElement('div');
            bubble.className = 'phoenix-message-content-user';
            bubble.textContent = text;
            msgWrapper.appendChild(bubble);
        }

        messages.appendChild(msgWrapper);
        messages.scrollTop = messages.scrollHeight;
    }

    function appendMessageWithOptions(text, options) {
        const wrapper = document.createElement('div');
        wrapper.className = 'phoenix-message bot';

        const avatar = document.createElement('img');
        avatar.src = activeAssistant.avatar;
        avatar.alt = activeAssistant.name;
        avatar.className = 'phoenix-bot-avatar';

        const content = document.createElement('div');
        content.className = 'phoenix-message-content';

        const meta = document.createElement('div');
        meta.className = 'phoenix-message-meta';
        const timestamp = new Date();
        meta.dataset.timestamp = timestamp.getTime();
        meta.textContent = `${activeAssistant.name} • Hace 1 min`;
        botMessageTimes.push({ meta, timestamp });

        const textNode = document.createElement('div');
        textNode.textContent = text;

        content.appendChild(meta);
        content.appendChild(textNode);
        wrapper.appendChild(avatar);
        wrapper.appendChild(content);
        messages.appendChild(wrapper);

        const buttonRow = document.createElement('div');
        buttonRow.className = 'phoenix-option-buttons';

        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'phoenix-option-button';
            button.textContent = option;
            button.onclick = function () {
                appendMessage(option, 'user');
                buttonRow.remove();
                sendToAI(option);
            };
            buttonRow.appendChild(button);
        });

        messages.appendChild(buttonRow);
        messages.scrollTop = messages.scrollHeight;
    }

    function formatTimeElapsed(timestamp) {
        const now = new Date();
        const diffMs = now - timestamp;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);
        const diffWeek = Math.floor(diffDay / 7);
        const diffMonth = Math.floor(diffDay / 30);
        const diffYear = Math.floor(diffDay / 365);

        if (diffMin < 60) return `Hace ${diffMin <= 0 ? '1 min' : diffMin + ' min'}`;
        if (diffHr < 24) return `Hace ${diffHr === 1 ? '1 hora' : diffHr + ' horas'}`;
        if (diffDay < 7) return `Hace ${diffDay === 1 ? '1 día' : diffDay + ' días'}`;
        if (diffWeek < 4) return `Hace ${diffWeek === 1 ? '1 semana' : diffWeek + ' semanas'}`;
        if (diffMonth < 12) return `Hace ${diffMonth === 1 ? '1 mes' : diffMonth + ' meses'}`;
        return `Hace ${diffYear === 1 ? '1 año' : diffYear + ' años'}`;
    }

    function updateBotTimestamps() {
        botMessageTimes.forEach(({ meta, timestamp }) => {
            meta.textContent = `${activeAssistant.name} • ${formatTimeElapsed(timestamp)}`;
        });
    }

    function sendToAI(userMessage) {
        phoenixConversationHistory.push({ role: 'user', content: userMessage });

        // Limitar a los últimos 6 mensajes más el de system
        const trimmedHistory = [phoenixConversationHistory[0], ...phoenixConversationHistory.slice(-6)];

        appendMessage('Escribiendo...', 'bot');

        fetch(phoenixChatbotBaseUrlData.ajaxurl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'phoenix_chatbot_message',
                history: JSON.stringify(trimmedHistory)
            })
        })
        .then(res => res.json())
        .then(data => {
            const last = messages.querySelector('.phoenix-message.bot:last-child');
            if (last) last.remove();

            if (data.success) {
                appendMessage(data.data.reply, 'bot');
                phoenixConversationHistory.push({ role: 'assistant', content: data.data.reply });
            } else {
                appendMessage("Lo siento, hubo un problema para obtener la respuesta 😕", 'bot');
            }
        })
        .catch(() => {
            const last = messages.querySelector('.phoenix-message.bot:last-child');
            if (last) last.remove();
            appendMessage("Hubo un error de conexión con el servidor.", 'bot');
        });
    }

    setTimeout(() => {
        loader.style.display = 'none';
        chatbot.style.display = 'flex';
        appendMessageWithOptions(
            '¡Hola! ¿En qué puedo ayudarte hoy?',
            ['Contratar servicio', 'Asistencia', 'Otro']
        );
    }, 3000);

    sendBtn.addEventListener('click', function () {
        const userInput = input.value.trim();
        if (!userInput) return;
        appendMessage(userInput, 'user');
        input.value = '';
        sendToAI(userInput);
    });

    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') sendBtn.click();
    });

    setInterval(updateBotTimestamps, 60000);
});
