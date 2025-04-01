// Obtener URL base del plugin desde wp_localize_script
const phoenixChatbotBaseUrl = phoenixChatbotBaseUrlData.baseUrl;

// Definir asistentes disponibles
const phoenixAssistants = [
    {
        name: "Valeria",
        avatar: phoenixChatbotBaseUrl + "assets/img/Valeria.png"
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

    // Función para agregar mensajes
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
            bubble.className = 'phoenix-message user';
            bubble.textContent = text;
            msgWrapper.appendChild(bubble);
        }

        messages.appendChild(msgWrapper);
        messages.scrollTop = messages.scrollHeight;
    }

    // Función para actualizar timestamps del bot cada minuto
    function updateBotTimestamps() {
        const now = new Date();
        botMessageTimes.forEach(({ meta, timestamp }) => {
            const diffMs = now - timestamp;
            const diffMins = Math.floor(diffMs / 60000);
            meta.textContent = `${activeAssistant.name} • Hace ${diffMins === 0 ? '1 min' : (diffMins + 1) + ' min'}`;
        });
    }

    // Mostrar loader por 3s y luego saludo inicial
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

        // Simular respuesta del bot
        setTimeout(() => {
            appendMessage('Soy un bot. ¡Gracias por tu mensaje!', 'bot');
        }, 1000);
    });

    // Permitir envío con Enter
    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendBtn.click();
        }
    });

    // Actualizar hora del bot cada minuto
    setInterval(updateBotTimestamps, 60000);
});
