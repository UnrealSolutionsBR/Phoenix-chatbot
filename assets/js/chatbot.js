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
        avatar: phoenixChatbotBaseUrl + "assets/img/Camila.png" // Puedes cambiar el avatar si tienes otro
    },
    {
        name: "Esteban",
        avatar: phoenixChatbotBaseUrl + "assets/img/Andres.png" // Puedes cambiar el avatar si tienes otro
    }
];

// Elegir asistente aleatorio
const activeAssistant = phoenixAssistants[Math.floor(Math.random() * phoenixAssistants.length)];
const startTimestamp = new Date(); // Marca de tiempo inicial para calcular "Hace X min"

// Calcular tiempo transcurrido
function getTimeElapsed() {
    const now = new Date();
    const diffMs = now - startTimestamp;
    const diffMins = Math.floor(diffMs / 60000);
    return `Hace ${diffMins === 0 ? '1 min' : (diffMins + 1) + ' min'}`;
}

document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('phoenix-user-input');
    const sendBtn = document.getElementById('phoenix-send-btn');
    const messages = document.getElementById('phoenix-chat-messages');
    const loader = document.getElementById('phoenix-loader');
    const chatbot = document.querySelector('.phoenix-chatbot-container');

    // Agregar mensaje al chat
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
            meta.textContent = `${activeAssistant.name} • ${getTimeElapsed()}`;

            const textNode = document.createElement('div');
            textNode.textContent = text;

            bubble.appendChild(meta);
            bubble.appendChild(textNode);
            msgWrapper.appendChild(avatar);
            msgWrapper.appendChild(bubble);
        } else {
            msgWrapper.textContent = text;
        }

        messages.appendChild(msgWrapper);
        messages.scrollTop = messages.scrollHeight;
    }

    // Mostrar loader 3s y luego saludo inicial
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
});
