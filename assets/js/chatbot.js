const phoenixChatbotBaseUrl = phoenixChatbotBaseUrlData.baseUrl;
const chatflow = phoenixChatbotBaseUrlData.flow;
const greetings = chatflow.greeting;

const phoenixAssistants = [
  { name: "Valeria", avatar: phoenixChatbotBaseUrl + "assets/img/Valeria.png" },
  { name: "Andrés", avatar: phoenixChatbotBaseUrl + "assets/img/Andres.png" },
  { name: "Camila", avatar: phoenixChatbotBaseUrl + "assets/img/Camila.png" },
  { name: "Renata", avatar: phoenixChatbotBaseUrl + "assets/img/Renata.png" },
  { name: "Esteban", avatar: phoenixChatbotBaseUrl + "assets/img/Esteban.png" }
];

const activeAssistant = phoenixAssistants[Math.floor(Math.random() * phoenixAssistants.length)];
let botMessageTimes = [];

let currentFlowKey = null;
let currentFlowStep = 0;
let currentFlowKeys = [];
let userData = {};
let currentFlow = null;

document.addEventListener("DOMContentLoaded", function () {
  const input = document.getElementById("phoenix-user-input");
  const sendBtn = document.getElementById("phoenix-send-btn");
  const messages = document.getElementById("phoenix-chat-messages");
  const loader = document.getElementById("phoenix-loader");
  const chatbot = document.querySelector(".phoenix-chatbot-container");

  function appendMessage(text, sender, isTemporary = false) {
    const msgWrapper = document.createElement("div");
    msgWrapper.className = "phoenix-message " + sender;
    if (isTemporary) msgWrapper.classList.add("typing");

    if (sender === "bot") {
      const avatar = document.createElement("img");
      avatar.src = activeAssistant.avatar;
      avatar.alt = activeAssistant.name;
      avatar.className = "phoenix-bot-avatar";

      const bubble = document.createElement("div");
      bubble.className = "phoenix-message-content";

      const meta = document.createElement("div");
      meta.className = "phoenix-message-meta";
      const timestamp = new Date();
      meta.dataset.timestamp = timestamp.getTime();
      meta.textContent = `${activeAssistant.name} • Hace 1 min`;

      botMessageTimes.push({ meta, timestamp });

      const textNode = document.createElement("div");
      textNode.innerHTML = text.replace(/\n/g, "<br>");

      bubble.appendChild(meta);
      bubble.appendChild(textNode);
      msgWrapper.appendChild(avatar);
      msgWrapper.appendChild(bubble);
    } else {
      const bubble = document.createElement("div");
      bubble.className = "phoenix-message-content-user";
      bubble.textContent = text;
      msgWrapper.appendChild(bubble);
    }

    messages.appendChild(msgWrapper);
    messages.scrollTop = messages.scrollHeight;

    return msgWrapper;
  }

  function simulateTypingAndRespond(callback, responseText) {
    const loading = document.createElement("div");
loading.className = "phoenix-message bot typing";

const avatar = document.createElement("img");
avatar.src = activeAssistant.avatar;
avatar.alt = activeAssistant.name;
avatar.className = "phoenix-bot-avatar";

const bubble = document.createElement("div");
bubble.className = "phoenix-message-content phoenix-typing-indicator";

const typingText = document.createElement("div");
typingText.className = "phoenix-typing-text";

bubble.appendChild(typingText);
loading.appendChild(avatar);
loading.appendChild(bubble);
messages.appendChild(loading);
messages.scrollTop = messages.scrollHeight;


    const delay = Math.min(3000 + responseText.length * 25, 8000);

    setTimeout(() => {
      loading.remove();
      callback();
    }, delay);
  }

  function appendMessageWithOptions(text, options, onClickHandler) {
    simulateTypingAndRespond(() => {
      if (text) appendMessage(text, "bot");

      const buttonRow = document.createElement("div");
      buttonRow.className = "phoenix-option-buttons";

      options.forEach((option) => {
        const button = document.createElement("button");
        button.className = "phoenix-option-button";
        button.textContent = option;
        button.onclick = function () {
          appendMessage(option, "user");
          buttonRow.remove();
          onClickHandler(option);
        };
        buttonRow.appendChild(button);
      });

      messages.appendChild(buttonRow);
      messages.scrollTop = messages.scrollHeight;
    }, text + options.join(" "));
  }

  function getGreetingByTime() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return greetings.morning;
    if (hour >= 12 && hour < 20) return greetings.afternoon;
    return greetings.night;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidPhone(phone) {
    return /^[\d\s\+\-\(\)]{7,}$/.test(phone);
  }

  function runFlow(key) {
    currentFlowKey = key;
    currentFlow = chatflow[key];
    currentFlowStep = 0;

    if (typeof currentFlow === "object" && !Array.isArray(currentFlow)) {
      if ('question' in currentFlow && 'options' in currentFlow) {
        simulateTypingAndRespond(() => {
          appendMessageWithOptions(currentFlow.question, currentFlow.options, (option) => {
            runNextFlowStep();
          });
        }, currentFlow.question);
      } else {
        currentFlowKeys = Object.keys(currentFlow);
        runNextFlowStep();
      }
    } else if (Array.isArray(currentFlow)) {
      currentFlowKeys = currentFlow;
      runNextFinalMessages();
    }
  }

  function runNextFlowStep() {
    const stepKey = currentFlowKeys[currentFlowStep];

    if (!stepKey) {
      if (currentFlowKey === "collect_user_data") return runFlow("lead_qualification");
      if (currentFlowKey === "lead_qualification") return runFlow("service_selection");
      if (currentFlowKey === "service_selection") return runFlow("web_development_branch");
      if (currentFlowKey === "web_development_branch") return runFlow("final_closure");
      return;
    }

    const stepValue = currentFlow[stepKey];

    if (Array.isArray(stepValue)) {
      const randomIndex = Math.floor(Math.random() * stepValue.length);
      let message = stepValue[randomIndex];
      if (stepKey.includes("email") && userData.name) {
        message = message.replace("{name}", userData.name);
      }
      simulateTypingAndRespond(() => {
        appendMessage(message, "bot");
      }, message);
    }
  }

  function runNextFinalMessages() {
    const message = currentFlowKeys[currentFlowStep];
    if (!message) return;

    const personalized = message.replace("{name}", userData.name || "usuario");

    simulateTypingAndRespond(() => {
      appendMessage(personalized, "bot");
      currentFlowStep++;
      if (currentFlowStep < currentFlowKeys.length) {
        runNextFinalMessages();
      }
    }, personalized);
  }

  function handleUserFlowInput(userInput) {
    const stepKey = currentFlowKeys[currentFlowStep];

    if (stepKey === "ask_name") {
      userData.name = userInput;
      currentFlowStep++;
      runNextFlowStep();
    } else if (stepKey === "ask_email") {
      if (!isValidEmail(userInput)) {
        return appendMessage("Ese correo no parece válido. ¿Podrías revisarlo?", "bot");
      }
      userData.email = userInput;
      currentFlowStep++;
      runNextFlowStep();
    } else if (stepKey === "ask_phone") {
      if (!isValidPhone(userInput)) {
        return appendMessage("Ese número no parece válido. Intenta escribirlo nuevamente, por favor.", "bot");
      }
      userData.phone = userInput;
      currentFlowStep++;
      runNextFlowStep();
    }
  }

  sendBtn.addEventListener("click", function () {
    const userInput = input.value.trim();
    if (!userInput) return;

    appendMessage(userInput, "user");

    if (currentFlow && typeof currentFlow === "object") {
      handleUserFlowInput(userInput);
    }

    input.value = "";
  });

  input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") sendBtn.click();
  });

  setTimeout(() => {
    loader.style.display = "none";
    chatbot.style.display = "flex";

    const greeting = getGreetingByTime().replace(activeAssistant.name, activeAssistant.name);
    const options = greetings.options;

    appendMessageWithOptions(greeting, options, (option) => {
      if (option === "Contratar servicio") {
        runFlow("collect_user_data");
      } else {
        appendMessage("Por favor, selecciona una opción relacionada con nuestros servicios.", "bot");
      }
    });
  }, 1000);

  setInterval(() => {
    botMessageTimes.forEach(({ meta, timestamp }) => {
      meta.textContent = `${activeAssistant.name} • ${formatTimeElapsed(timestamp)}`;
    });
  }, 60000);

  function formatTimeElapsed(timestamp) {
    const now = new Date();
    const diffMin = Math.floor((now - timestamp) / 60000);
    if (diffMin < 60) return `Hace ${diffMin <= 0 ? "1 min" : diffMin + " min"}`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `Hace ${diffHr === 1 ? "1 hora" : diffHr + " horas"}`;
    const diffDay = Math.floor(diffHr / 24);
    return `Hace ${diffDay === 1 ? "1 día" : diffDay + " días"}`;
  }
});