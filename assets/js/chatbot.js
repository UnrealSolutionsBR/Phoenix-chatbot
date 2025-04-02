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
        content: `Eres un asistente virtual profesional de Unreal Solutions. Tu objetivo es guiar al usuario paso a paso en una conversación, haciendo preguntas naturales, cercanas y claras según cada intención recibida del sistema.`
    }
];

let currentFlow = null;
let currentFlowKey = null;
let currentFlowStep = 0;
let userData = {};

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
                    runDynamicFlow('collect_user_data');
                } else {
                    sendToAI(option);
                }
            };
            buttonRow.appendChild(button);
        });

        messages.appendChild(buttonRow);
        messages.scrollTop = messages.scrollHeight;
    }

    function runDynamicFlow(stepKey) {
        currentFlow = flow?.[stepKey];
        currentFlowKey = stepKey;
        currentFlowStep = 0;
        if (!currentFlow || !Array.isArray(currentFlow)) return;

        askNextFlowQuestion();
    }

    function askNextFlowQuestion() {
        if (!currentFlow || currentFlowStep >= currentFlow.length) {
            // Cambiar automáticamente al siguiente flujo si está definido
            if (currentFlowKey === 'collect_user_data' && flow.lead_qualification) {
                runDynamicFlow('lead_qualification');
                return;
            }

            currentFlow = null;
            currentFlowKey = null;
            currentFlowStep = 0;
            return;
        }

        const currentIntent = currentFlow[currentFlowStep];

        fetch(phoenixChatbotBaseUrlData.ajaxurl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'phoenix_generate_flow_message',
                intent: currentIntent,
                history: JSON.stringify(phoenixConversationHistory),
                user_data: JSON.stringify(userData)
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const message = data.data.reply;
                appendMessage(message, 'bot');
                phoenixConversationHistory.push({ role: 'assistant', content: message });
            } else {
                appendMessage("Hubo un problema generando la pregunta 😕", 'bot');
            }
        })
        .catch(() => {
            appendMessage("Error de conexión con el servidor.", 'bot');
        });
    }

    function isValidEmail(email) {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(email);
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
        phoenixConversationHistory.push({ role: 'user', content: userInput });

        // Validación y flujo guiado
        if (currentFlow) {
            const intent = currentFlow[currentFlowStep];

            if (intent === 'pedir_nombre') {
                userData.name = userInput;
            }

            if (intent === 'pedir_email') {
                if (!isValidEmail(userInput)) {
                    appendMessage("Parece que el correo no es válido. ¿Podrías verificarlo?", 'bot');
                    phoenixConversationHistory.push({ role: 'assistant', content: "Parece que el correo no es válido. ¿Podrías verificarlo?" });
                    input.value = '';
                    return; // NO avanzar al siguiente paso
                }
                userData.email = userInput;
            }

            if (intent === 'pedir_telefono') {
                userData.phone = userInput;
            }

            currentFlowStep++;
            input.value = '';
            setTimeout(askNextFlowQuestion, 600);
            return;
        }

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
