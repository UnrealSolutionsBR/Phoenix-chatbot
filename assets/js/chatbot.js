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
            avatar.src = 'https://i.ibb.co/JrsqQ2r/bot-avatar.png'; // Puedes cambiar esta URL por tu propia imagen
            avatar.alt = 'Bot Avatar';
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
    

    // Mostrar loader por 3 segundos, luego mostrar chat y primer mensaje del bot
    setTimeout(() => {
        loader.style.display = 'none';
        chatbot.style.display = 'block';
        appendMessage('Hola, ¿en qué puedo ayudarte hoy?', 'bot');
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

    // Enviar al presionar Enter
    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendBtn.click();
        }
    });
});
