// Obtener URL base del plugin desde wp_localize_script
const phoenixChatbotBaseUrl = phoenixChatbotBaseUrlData.baseUrl;

// Asistentes disponibles
const phoenixAssistants = [
    {
        name: "Valeria",
        avatar: phoenixChatbotBaseUrl + "assets/img/Valeria.PNG"
    },
    {
        name: "Andrés",
        avatar: phoenixChatbotBaseUrl + "assets/img/Andres.png"
    },
    {
        name: "Camila",
        avatar: phoenixChatbotBaseUrl + "assets/img/Camila.png"
    },
    {
        name: "Renata",
        avatar: phoenixChatbotBaseUrl + "assets/img/Camila.png"
    },
    {
        name: "Esteban",
        avatar: phoenixChatbotBaseUrl + "assets/img/Andres.png"
    }
];

// Elegir asistente aleatorio
const activeAssistant = phoenixAssistants[Math.floor(Math.random() * phoenixAssistants.length)];
let botMessageTimes = [];

document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('phoenix-user-input');
    const sendBtn = document.getElementById('phoenix-send-btn');
    const messages = document.getElementById('phoenix-chat-messages');
    const loader = document.getElementById('phoenix-loader');
    const chatbot = document.querySelector('.phoenix-chatbot-container');

    // Agregar mensaje
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

    // Formatear tiempo relativo
    function formatTimeElapsed(timestamp) {
        const now = new Date();
        const diffMs = now - timestamp;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);
        const diffWeek = Math.floor(diffDay / 7);
        const diffMonth = Math.floor(diffDay / 30);
        const diffYear = Math.floor(diffDay / 365);

        if (diffMin < 60) {
            return `Hace ${diffMin <= 0 ? '1 min' : diffMin + ' min'}`;
        } else if (diffHr < 24) {
            return `Hace ${diffHr === 1 ? '1 hora' : diffHr + ' horas'}`;
        } else if (diffDay < 7) {
            return `Hace ${diffDay === 1 ? '1 día' : diffDay + ' días'}`;
        } else if (diffWeek < 4) {
            return `Hace ${diffWeek === 1 ? '1 semana' : diffWeek + ' semanas'}`;
        } else if (diffMonth < 12) {
            return `Hace ${diffMonth === 1 ? '1 mes' : diffMonth + ' meses'}`;
        } else {
            return `Hace ${diffYear === 1 ? '1 año' : diffYear + ' años'}`;
        }
    }

    // Actualizar textos de tiempo
    function updateBotTimestamps() {
        botMessageTimes.forEach(({ meta, timestamp }) => {
            meta.textContent = `${activeAssistant.name} • ${formatTimeElapsed(timestamp)}`;
        });
    }

    // Mostrar loader y saludo inicial
    setTimeout(() => {
        loader.style.display = 'none';
        chatbot.style.display = 'block';

        const hour = new Date().getHours();
        let greeting = '';

        if (hour >= 6 && hour < 12) {
            greeting = '¡Hola, buen día! 😊 ¿En qué puedo ayudarte esta mañana?';
        } else if (hour >= 12 && hour < 19) {
            greeting = '¡Hola, buenas tardes! 😊 ¿Cómo puedo ayudarte hoy?';
        } else {
            greeting = '¡Hola, buenas noches! 😊 ¿En qué puedo apoyarte en este momento?';
        }

        appendMessage(greeting, 'bot');
    }, 3000);

    // Enviar mensaje del usuario
    sendBtn.addEventListener('click', function () {
        const userInput = input.value.trim();
        if (!userInput) return;

        appendMessage(userInput, 'user');
        input.value = '';

        setTimeout(() => {
            appendMessage('Soy un bot. ¡Gracias por tu mensaje!', 'bot');
        }, 1000);
    });

    // Permitir Enter
    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendBtn.click();
        }
    });

    // Actualizar cada minuto
    setInterval(updateBotTimestamps, 60000);
});
