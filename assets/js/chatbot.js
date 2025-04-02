const phoenixChatbotBaseUrl = phoenixChatbotBaseUrlData.baseUrl;
const greetings = phoenixChatbotBaseUrlData.greetings;
const flow = phoenixChatbotBaseUrlData.flow;

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
        content: `Eres Valeria, Camila, Andrés, Renata o Esteban, el asistente virtual de Unreal Solutions. Tu trabajo es conversar de forma natural, profesional y útil con personas interesadas en servicios como desarrollo web, edición de video o marketing digital.

- Evita repetir la frase "En Unreal Solutions..." en cada mensaje.
- Organiza tus ideas con saltos de línea y listas verticales para que el texto sea fácil de leer.
- Sé conversacional: usa oraciones cortas, no hables como folleto corporativo.
- Si vas a hacer preguntas al usuario, sepáralas con viñetas o saltos de línea.
- Menciona la marca o sugiere agendar reunión solo si tiene sentido.

Tu objetivo es generar confianza, entender al cliente y ofrecer soluciones.`
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
            textNode.innerHTML = text.replace(/\n/g, "<br>");

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
        appendMessage(text, 'bot');

        const buttonRow = document.createElement('div');
        buttonRow.className = 'phoenix-option-buttons';

        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'phoenix-option-button';
            button.textContent = option;
            button.onclick = function () {
                appendMessage(option, 'user');
                buttonRow.remove();

                if (option === "Contratar servicio") {
                    showFlowStep('collect_user_data');
                } else {
                    sendToAI(option);
                }
            };
            buttonRow.appendChild(button);
        });

        messages.appendChild(buttonRow);
        messages.scrollTop = messages.scrollHeight;
    }

    function showFlowStep(stepKey) {
        const stepData = flow?.[stepKey];
        if (!stepData || !Array.isArray(stepData)) return;

        stepData.forEach((text, index) => {
            setTimeout(() => {
                appendMessage(text, 'bot');
                phoenixConversationHistory.push({ role: 'assistant', content: text });
            }, index * 1200);
        });
    }

    function sendToAI(userMessage) {
        phoenixConversationHistory.push({ role: 'user', content: userMessage });

        appendMessage('Escribiendo...', 'bot');

        fetch(phoenixChatbotBaseUrlData.ajaxurl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'phoenix_chatbot_message',
                history: JSON.stringify(phoenixConversationHistory)
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

    function getGreetingByTime() {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) return greetings.morning;
        if (hour >= 12 && hour < 20) return greetings.afternoon;
        return greetings.night;
    }

    setTimeout(() => {
        loader.style.display = 'none';
        chatbot.style.display = 'flex';

        const greeting = getGreetingByTime();
        const options = greetings.options;

        phoenixConversationHistory.push({ role: 'assistant', content: greeting });
        appendMessageWithOptions(greeting, options);
    }, 2000);

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

    setInterval(() => {
        botMessageTimes.forEach(({ meta, timestamp }) => {
            meta.textContent = `${activeAssistant.name} • ${formatTimeElapsed(timestamp)}`;
        });
    }, 60000);

    function formatTimeElapsed(timestamp) {
        const now = new Date();
        const diffMin = Math.floor((now - timestamp) / 60000);
        if (diffMin < 60) return `Hace ${diffMin <= 0 ? '1 min' : diffMin + ' min'}`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `Hace ${diffHr === 1 ? '1 hora' : diffHr + ' horas'}`;
        const diffDay = Math.floor(diffHr / 24);
        return `Hace ${diffDay === 1 ? '1 día' : diffDay + ' días'}`;
    }
});
