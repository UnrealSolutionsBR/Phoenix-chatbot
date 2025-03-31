document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('phoenix-user-input');
    const sendBtn = document.getElementById('phoenix-send-btn');
    const messages = document.getElementById('phoenix-chat-messages');
    const loader = document.getElementById('phoenix-loader');
    const chatbot = document.querySelector('.phoenix-chatbot-container');

    // Función para agregar mensajes
    function appendMessage(text, sender) {
        const msg = document.createElement('div');
        msg.className = 'phoenix-message ' + sender;
        msg.textContent = text;
        messages.appendChild(msg);
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
