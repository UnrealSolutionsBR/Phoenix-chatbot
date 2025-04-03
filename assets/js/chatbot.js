const phoenixChatbotBaseUrl = phoenixChatbotBaseUrlData.baseUrl;
const phoenixChatbotFlow = phoenixChatbotBaseUrlData.chatflow;

const phoenixAssistants = [
    { name: "Valeria", avatar: phoenixChatbotBaseUrl + "assets/img/Valeria.png" },
    { name: "Andrés", avatar: phoenixChatbotBaseUrl + "assets/img/Andres.png" },
    { name: "Camila", avatar: phoenixChatbotBaseUrl + "assets/img/Camila.png" },
    { name: "Renata", avatar: phoenixChatbotBaseUrl + "assets/img/Renata.png" },
    { name: "Esteban", avatar: phoenixChatbotBaseUrl + "assets/img/Esteban.png" }
];

const activeAssistant = phoenixAssistants[Math.floor(Math.random() * phoenixAssistants.length)];
let botMessageTimes = [];

let currentFlow = null;
let currentStep = 0;

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
        if (text) appendMessage(text, 'bot');

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
                    runFlow('collect_user_data');
                } else {
                    appendMessage(`Gracias por elegir "${option}". ¿En qué más puedo ayudarte?`, 'bot');
                }
            };
            buttonRow.appendChild(button);
        });

        messages.appendChild(buttonRow);
        messages.scrollTop = messages.scrollHeight;
    }

    function runFlow(flowKey) {
        if (!phoenixChatbotFlow[flowKey]) return;
        currentFlow = phoenixChatbotFlow[flowKey];
        currentStep = 0;
        nextStep();
    }

    function nextStep() {
        if (!currentFlow || currentStep >= currentFlow.length) {
            currentFlow = null;
            currentStep = 0;
            return;
        }

        const message = currentFlow[currentStep];
        appendMessage(message, 'bot');
        currentStep++;
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

    setTimeout(() => {
        loader.style.display = 'none';
        chatbot.style.display = 'block';

        const greeting = phoenixChatbotFlow.greeting.morning;
        const options = phoenixChatbotFlow.greeting.options;

        appendMessageWithOptions(greeting, options);
    }, 2000);

    sendBtn.addEventListener('click', function () {
        const userInput = input.value.trim();
        if (!userInput) return;
        appendMessage(userInput, 'user');
        input.value = '';

        if (currentFlow) {
            setTimeout(nextStep, 600);
        } else {
            setTimeout(() => {
                appendMessage('Gracias por tu mensaje. ¿En qué más puedo ayudarte?', 'bot');
            }, 1000);
        }
    });

    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') sendBtn.click();
    });

    setInterval(updateBotTimestamps, 60000);
});
