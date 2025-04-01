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

// Elegir asistente aleatorio al iniciar
const activeAssistant = phoenixAssistants[Math.floor(Math.random() * phoenixAssistants.length)];

document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('phoenix-user-input');
    const sendBtn = document.getElementById('phoenix-send-btn');
    const messages = document.getElementById('phoenix-chat-messages');
    const loader = document.getElementById('phoenix-loader');
    const chatbot = document.querySelector('.phoenix-chatbot-container');

    // Función para agregar mensajes al chat
    function appendMessage(text, sender) {
        const msgWrapper = document.createElement('div');
        msgWrapper.className = 'phoenix-message ' + sender;

        if (sender === 'bot') {
            const avatar = document.createElement('img');
            avatar.src = activeAssistant.avatar;
            avatar.alt = activeAssistant.name;
            avatar.className = 'phoenix-bot-avatar';

            const content = document.createElement('div');
            content.className = 'phoenix-message-content';
            content.textContent = text;

            msgWrapper.appendChild(avatar);
            msgWrapper.appendChild(content);

            const time = document.createElement('div');
            time.className = 'phoenix-message-time';
            const now = new Date();
            time.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            msgWrapper.appendChild(time);
        } else {
            msgWrapper.textContent = text;
        }

        messages.appendChild(msgWrapper);
        messages.scrollTop = messages.scrollHeight;
    }

    // Mostrar loader y luego el chat con el saludo del asistente
    setTimeout(() => {
        loader.style.display = 'none';
        chatbot.style.display = 'block';

        appendMessage(`Hola, soy ${activeAssistant.name}. ¿En qué puedo ayudarte hoy?`, 'bot');
    }, 3000);

    // Enviar mensaje del usuario
    sendBtn.addEventListener('click', function () {
        const userInput = input.value.trim();
        if (!userInput) return;

        appendMessage(userInput, 'user');
        input.value = '';

        // Simulación de respuesta automática
        setTimeout(() => {
            appendMessage('Soy un bot. ¡Gracias por tu mensaje!', 'bot');
        }, 1000);
    });

    // Enviar mensaje con tecla Enter
    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendBtn.click();
        }
    });
});
