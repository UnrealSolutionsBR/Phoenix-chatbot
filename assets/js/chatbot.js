// Obtener URL base del plugin desde wp_localize_script
const phoenixChatbotBaseUrl = phoenixChatbotBaseUrlData.baseUrl;

// Definir asistentes disponibles
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
    }
];

// Elegir asistente aleatorio
const activeAssistant = phoenixAssistants[Math.floor(Math.random() * phoenixAssistants.length)];

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
            // Avatar
            const avatar = document.createElement('img');
            avatar.src = activeAssistant.avatar;
            avatar.alt = activeAssistant.name;
            avatar.className = 'phoenix-bot-avatar';

            // Burbuja de mensaje
            const bubble = document.createElement('div');
            bubble.className = 'phoenix-message-content';

            // Meta info (nombre + hora)
            const meta = document.createElement('div');
            meta.className = 'phoenix-message-meta';
            const now = new Date();
            const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            meta.textContent = `${activeAssistant.name} • ${time}`;

            // Texto del mensaje
            const textNode = document.createElement('div');
            textNode.textContent = text;

            // Componer mensaje
            bubble.appendChild(meta);
            bubble.appendChild(textNode);

            msgWrapper.appendChild(avatar);
            msgWrapper.appendChild(bubble);
        } else {
            // Mensaje del usuario
            msgWrapper.textContent = text;
        }

        messages.appendChild(msgWrapper);
        messages.scrollTop = messages.scrollHeight;
    }

    // Mostrar loader por 3s, luego iniciar chat con saludo
    setTimeout(() => {
        loader.style.display = 'none';
        chatbot.style.display = 'block';

        const now = new Date();
        const hour = now.getHours();
        let greeting = '';

        if (hour >= 6 && hour < 12) {
            greeting = '¡Hola, buen día! 😊\n¿En qué puedo ayudarte esta mañana?';
        } else if (hour >= 12 && hour < 19) {
            greeting = '¡Hola, buenas tardes! 😊\n¿Cómo puedo ayudarte hoy?';
        } else {
            greeting = '¡Hola, buenas noches! 😊\n¿En qué puedo apoyarte en este momento?';
        }

        appendMessage(greeting, 'bot');
    }, 3000);

    // Enviar mensaje del usuario
    sendBtn.addEventListener('click', function () {
        const userInput = input.value.trim();
        if (!userInput) return;

        appendMessage(userInput, 'user');
        input.value = '';

        // Simulación de respuesta del bot
        setTimeout(() => {
            appendMessage('Soy un bot. ¡Gracias por tu mensaje!', 'bot');
        }, 1000);
    });

    // Permitir enviar con Enter
    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendBtn.click();
        }
    });
});
