// chatbot.js completo actualizado para mostrar GIFs dentro del mismo bubble

const phoenixChatbotBaseUrl = phoenixChatbotBaseUrlData.baseUrl;
const flow = phoenixChatbotBaseUrlData.flow.conversation;

const phoenixAssistants = [
  { name: "Valeria", avatar: phoenixChatbotBaseUrl + "assets/img/Valeria.png" },
  { name: "Andrés", avatar: phoenixChatbotBaseUrl + "assets/img/Andres.png" },
  { name: "Camila", avatar: phoenixChatbotBaseUrl + "assets/img/Camila.png" },
  { name: "Renata", avatar: phoenixChatbotBaseUrl + "assets/img/Renata.png" },
  { name: "Esteban", avatar: phoenixChatbotBaseUrl + "assets/img/Esteban.png" }
];

const activeAssistant = phoenixAssistants[Math.floor(Math.random() * phoenixAssistants.length)];
let botMessageTimes = [];
let userData = {};
let currentStepIndex = 0;
let currentSteps = [];
let currentNode = null;

function getNodeById(id) {
  return flow.find(node => node.id === id);
}

function replaceVariables(text) {
  return text.replace(/\{(\w+)\}/g, (_, key) => userData[key] || `{${key}}`);
}

function appendMessage(content, sender) {
  const messages = document.getElementById("phoenix-chat-messages");
  const msgWrapper = document.createElement("div");
  msgWrapper.className = "phoenix-message " + sender;

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
    console.log("Contenido recibido en appendMessage:", content);

    if (typeof content === "object" && content.gif) {
      const gifUrl = content.gif;
      const text = content.text || "";
      textNode.innerHTML = `${replaceVariables(text).replace(/\n/g, "<br>")}<br><img src="${gifUrl}" alt="GIF" style="max-width: 50%; border-radius: 10px; margin-top: 8px;">`;
    } else {
      textNode.innerHTML = replaceVariables(content).replace(/\n/g, "<br>");
    }

    bubble.appendChild(meta);
    bubble.appendChild(textNode);
    msgWrapper.appendChild(avatar);
    msgWrapper.appendChild(bubble);
  } else {
    const bubble = document.createElement("div");
    bubble.className = "phoenix-message-content-user";
    bubble.textContent = content;
    msgWrapper.appendChild(bubble);
  }

  messages.appendChild(msgWrapper);
  messages.scrollTop = messages.scrollHeight;
  return msgWrapper;
}

function simulateTypingAndRespond(callback, responseText) {
  const messages = document.getElementById("phoenix-chat-messages");
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

  const delay = Math.min(3000 + (typeof responseText === 'string' ? responseText.length * 25 : 400), 8000);
  setTimeout(() => {
    loading.remove();
    callback();
  }, delay);
}

function runMessages(messages, callback, index = 0) {
  if (index >= messages.length) return callback();
  const msg = messages[index];
  simulateTypingAndRespond(() => {
    appendMessage(msg, "bot");
    runMessages(messages, callback, index + 1);
  }, typeof msg === 'string' ? msg : '[GIF]');
}

function nextNode(id) {
  currentNode = getNodeById(id);
  if (!currentNode) return console.error("❌ Nodo no encontrado:", id);

  if (currentNode.steps) {
    currentSteps = currentNode.steps;
    currentStepIndex = 0;
    runStep();
  } else if (currentNode.messages) {
    runMessages(currentNode.messages, () => {
      if (currentNode.next) nextNode(currentNode.next);
    });
  } else if (currentNode.question && currentNode.options) {
    appendMessageWithOptions(currentNode.question, currentNode.options, (option) => {
      userData[currentNode.id] = option;
      if (currentNode.next_if && currentNode.next_if[option]) {
        nextNode(currentNode.next_if[option]);
      } else {
        nextNode(currentNode.next);
      }
    });
  }
}

function runStep() {
  const step = currentSteps[currentStepIndex];
  if (!step) return;

  const goToNext = () => {
    if (step.next) {
      const nextStepIndex = currentSteps.findIndex(s => s.id === step.next);
      if (nextStepIndex !== -1) {
        currentStepIndex = nextStepIndex;
        runStep();
        return;
      } else {
        return nextNode(step.next);
      }
    }
    currentStepIndex++;
    if (currentStepIndex < currentSteps.length) {
      runStep();
    } else if (currentNode.next) {
      nextNode(currentNode.next);
    }
  };

  if (step.messages) {
    const randomMessage = step.messages[Math.floor(Math.random() * step.messages.length)];
    simulateTypingAndRespond(() => {
      appendMessage(randomMessage, "bot");
      if (!['ask_name', 'ask_email', 'ask_phone'].includes(step.id)) goToNext();
    }, randomMessage);
  } else if (step.question && step.options) {
    appendMessageWithOptions(step.question, step.options, (option) => {
      userData[step.id] = option;
      if (step.followup) {
        runMessages(step.followup, () => {
          if (step.types) {
            const typeMsgs = step.types.map(type =>
              { return { gif: null, text: `<b>${type.name}</b>: ${type.description}${type.example ? `<br><i>${type.example}</i>` : ''}` }; });
            runMessages(typeMsgs.map(t => t.text), goToNext);
          } else {
            goToNext();
          }
        });
      } else if (step.types) {
        const typeMsgs = step.types.map(type =>
          `<b>${type.name}</b>: ${type.description}${type.example ? `<br><i>${type.example}</i>` : ''}`);
        runMessages(typeMsgs, goToNext);
      } else {
        goToNext();
      }
    });
  }
}

function appendMessageWithOptions(text, options, onClickHandler) {
  simulateTypingAndRespond(() => {
    if (text) appendMessage(text, "bot");

    const messages = document.getElementById("phoenix-chat-messages");
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

document.addEventListener("DOMContentLoaded", function () {
  const input = document.getElementById("phoenix-user-input");
  const sendBtn = document.getElementById("phoenix-send-btn");

  sendBtn.addEventListener("click", function () {
    const userInput = input.value.trim();
    if (!userInput) return;
    appendMessage(userInput, "user");
    handleFreeTextInput(userInput);
    input.value = "";
  });

  input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") sendBtn.click();
  });

  setTimeout(() => {
    document.getElementById("phoenix-loader").style.display = "none";
    document.querySelector(".phoenix-chatbot-container").style.display = "flex";
    startChat();
  }, 1000);

  setInterval(() => {
    botMessageTimes.forEach(({ meta, timestamp }) => {
      meta.textContent = `${activeAssistant.name} • ${formatTimeElapsed(timestamp)}`;
    });
  }, 60000);
});

function startChat() {
  const hour = new Date().getHours();
  let greetingKey = 'night';
  if (hour >= 6 && hour < 12) greetingKey = 'morning';
  else if (hour >= 12 && hour < 20) greetingKey = 'afternoon';

  const greetingNode = getNodeById('greeting');
  const greetingText = greetingNode.messages[greetingKey];
  const options = greetingNode.options;

  appendMessageWithOptions(greetingText, options, (option) => {
    if (option === "Contratar servicio") {
      nextNode(greetingNode.next);
    } else {
      appendMessage("Por favor, selecciona una opción relacionada con nuestros servicios.", "bot");
    }
  });
}

function handleFreeTextInput(userInput) {
  if (!currentNode || !currentNode.steps) return;
  const step = currentSteps[currentStepIndex];
  if (!step) return;

  const goToNext = () => {
    if (step.next) {
      const nextStepIndex = currentSteps.findIndex(s => s.id === step.next);
      if (nextStepIndex !== -1) {
        currentStepIndex = nextStepIndex;
        runStep();
        return;
      } else {
        return nextNode(step.next);
      }
    }
    currentStepIndex++;
    if (currentStepIndex < currentSteps.length) {
      runStep();
    } else if (currentNode.next) {
      nextNode(currentNode.next);
    }
  };

  if (step.id === "ask_name") {
    userData.name = userInput;
    goToNext();
  } else if (step.id === "ask_email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInput)) {
      return appendMessage("Ese correo no parece válido. ¿Podrías revisarlo?", "bot");
    }
    userData.email = userInput;
    goToNext();
  } else if (step.id === "ask_phone") {
    if (!/^[\d\s\+\-\(\)]{7,}$/.test(userInput)) {
      return appendMessage("Ese número no parece válido. Intenta escribirlo nuevamente, por favor.", "bot");
    }
    userData.phone = userInput;
    goToNext();
  }
}

function formatTimeElapsed(timestamp) {
  const now = new Date();
  const diffMin = Math.floor((now - timestamp) / 60000);
  if (diffMin < 60) return `Hace ${diffMin <= 0 ? "1 min" : diffMin + " min"}`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Hace ${diffHr === 1 ? "1 hora" : diffHr + " horas"}`;
  const diffDay = Math.floor(diffHr / 24);
  return `Hace ${diffDay === 1 ? "1 día" : diffDay + " días"}`;
}
