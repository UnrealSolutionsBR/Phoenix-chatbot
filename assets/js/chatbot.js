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
userData.bot_name = activeAssistant.name;
let currentStepIndex = 0;
let currentSteps = [];
let currentNode = null;

function getNodeById(id) {
  return flow.find(node => node.id === id);
}

function replaceVariables(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/\{(\w+)\}/g, (_, key) => userData[key] || `{${key}}`);
}
function appendMessage(content, sender, isTemporary = false) {
  const messages = document.getElementById("phoenix-chat-messages");
  const msgWrapper = document.createElement("div");
  msgWrapper.className = "phoenix-message " + sender;
  if (isTemporary) msgWrapper.classList.add("typing");

  if (sender === "bot") {
    // Crear avatar
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
    if (typeof content === "object" && content.gif) {
      const text = content.text ? replaceVariables(content.text).replace(/\n/g, "<br>") + "<br>" : "";
      const gif = `<img src="${content.gif}" alt="GIF" style="max-width: 100%; border-radius: 10px;">`;
      textNode.innerHTML = text + gif;
    } else {
      textNode.innerHTML = replaceVariables(content).replace(/\n/g, "<br>");
    }

    bubble.appendChild(meta);
    bubble.appendChild(textNode);

    // Eliminar avatar solo del último bloque de bot si no hay usuario entre medio
    const allMessages = [...document.querySelectorAll(".phoenix-message")];
    for (let i = allMessages.length - 1; i >= 0; i--) {
      const msg = allMessages[i];
      if (msg.classList.contains("user")) break;
      if (msg.classList.contains("bot")) {
        const avatarEl = msg.querySelector(".phoenix-bot-avatar");
        if (avatarEl) {
  const spacer = document.createElement("div");
  spacer.style.width = "48px";
  spacer.style.height = "48px";
  spacer.style.marginRight = "12px";
  msg.insertBefore(spacer, msg.children[0]);
  avatarEl.remove();
}
        break;
      }
    }

    msgWrapper.appendChild(avatar);
    msgWrapper.appendChild(bubble);
  } else {
    const bubble = document.createElement("div");
    bubble.className = "phoenix-message-content-user";
    bubble.textContent = content;
    msgWrapper.appendChild(bubble);
  }

  messages.appendChild(msgWrapper);
  requestAnimationFrame(() => {
  messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
});

  return msgWrapper;
}
function appendSystemNotice(text) {
  const messages = document.getElementById("phoenix-chat-messages");
  const notice = document.createElement("div");
  notice.textContent = text;
  notice.style.textAlign = "center";
  notice.style.color = "#444";
  notice.style.fontSize = "14px";
  notice.style.margin = "20px 0";
  messages.appendChild(notice);

  requestAnimationFrame(() => {
    messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
  });
}
function simulateTypingAndRespond(callback, responseText) {
  const messages = document.getElementById("phoenix-chat-messages");
  const allMessages = [...document.querySelectorAll(".phoenix-message")];
for (let i = allMessages.length - 1; i >= 0; i--) {
  const msg = allMessages[i];
  if (msg.classList.contains("user")) break;
  if (msg.classList.contains("bot")) {
    const avatarEl = msg.querySelector(".phoenix-bot-avatar");
    if (avatarEl) {
      const spacer = document.createElement("div");
      spacer.style.width = "48px";
      spacer.style.height = "48px";
      spacer.style.marginRight = "12px";
      msg.insertBefore(spacer, msg.children[0]);
      avatarEl.remove();
    }
    break;
  }
}
  const loading = document.createElement("div");
  loading.className = "phoenix-message bot typing";

  const avatar = document.createElement("img");
  avatar.src = activeAssistant.avatar;
  avatar.alt = activeAssistant.name;
  avatar.className = "phoenix-bot-avatar";

// Verifica si hay otro mensaje de bot justo antes
const previousMessages = [...document.querySelectorAll('.phoenix-message')];
const lastMessage = previousMessages[previousMessages.length - 1];
if (lastMessage && lastMessage.classList.contains('bot')) {
  avatar.classList.add('slide-down');
}

  const bubble = document.createElement("div");
  bubble.className = "phoenix-message-content phoenix-typing-indicator";
  const typingText = document.createElement("div");
  typingText.className = "phoenix-typing-text";

  bubble.appendChild(typingText);
  loading.appendChild(avatar);
  loading.appendChild(bubble);
  messages.appendChild(loading);
  requestAnimationFrame(() => {
  messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
});
  const delay = Math.floor(Math.random() * 4000) + 1000; // entre 1000ms y 5000ms (1s a 5s)

  setTimeout(() => {
    loading.remove();
    callback();
  }, delay);
}

function runMessages(messages, callback, index = 0) {
  if (index >= messages.length) return callback();

  const rawMsg = messages[index];
  let processedMsg = rawMsg;

  if (typeof rawMsg === 'object' && rawMsg !== null) {
    if (rawMsg.name && rawMsg.description) {
      processedMsg = `<b>${rawMsg.name}</b>: ${rawMsg.description}`;
      if (rawMsg.example) processedMsg += `<br><i>${rawMsg.example}</i>`;
    } else if ('text' in rawMsg) {
      processedMsg = {
        text: replaceVariables(rawMsg.text),
        gif: rawMsg.gif
      };
    } else {
      processedMsg = '';
    }
  } else if (typeof rawMsg === 'string') {
    processedMsg = replaceVariables(rawMsg);
  } else {
    processedMsg = '';
  }

  simulateTypingAndRespond(() => {
    appendMessage(processedMsg, "bot");
    runMessages(messages, callback, index + 1);
  }, typeof processedMsg === 'string' ? processedMsg : (processedMsg.text || ''));
}
function nextNode(id) {
  currentNode = getNodeById(id);
  if (!currentNode) return;

  if (currentNode.steps) {
    currentSteps = currentNode.steps;
    currentStepIndex = 0;
    runStep();
  } else if (currentNode.messages) {
    if (currentNode.send_all) {
      runMessages(currentNode.messages, () => {
        if (currentNode.next) nextNode(currentNode.next);
      });
    } else {
      const randomMessage = currentNode.messages[Math.floor(Math.random() * currentNode.messages.length)];
      simulateTypingAndRespond(() => {
        appendMessage(randomMessage, "bot");
        if (currentNode.next) nextNode(currentNode.next);
      }, typeof randomMessage === 'string' ? randomMessage : (randomMessage.text || ''));
    }
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
    if (step.send_all) {
      runMessages(step.messages, () => {
        if (!['ask_name', 'ask_email', 'ask_phone'].includes(step.id)) goToNext();
      });
    } else {
      const randomMessage = step.messages[Math.floor(Math.random() * step.messages.length)];
      simulateTypingAndRespond(() => {
        appendMessage(randomMessage, "bot");
        if (!['ask_name', 'ask_email', 'ask_phone'].includes(step.id)) goToNext();
      }, typeof randomMessage === 'string' ? randomMessage : (randomMessage.text || ''));
    }
  } else if (step.question && step.options) {
    appendMessageWithOptions(step.question, step.options, (option) => {
      userData[step.id] = option;
      if (step.followup) {
        const followupMsgs = step.followup.map(msg => replaceVariables(msg));
        runMessages(followupMsgs, () => {
          goToNext();
        });
      } else {
        goToNext();
      }
    });
  } else {
    goToNext();
  }
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
    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(userInput)) {
    return appendMessage("Ese correo no parece válido. ¿Podrías revisarlo?", "bot");
}
    userData.email = userInput;
    goToNext();
  } else if (step.id === "ask_phone") {
    if (!/^\d{7,}$/.test(userInput)) {
      return appendMessage("Ese número no parece válido. Intenta escribirlo nuevamente, por favor.", "bot");
    }
    userData.phone = userInput;
    goToNext();
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
    requestAnimationFrame(() => {
  messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
});
  }, text + options.join(" "));
}

function startChat() {
  const hour = new Date().getHours();
  let greetingKey = 'night';
  if (hour >= 6 && hour < 12) greetingKey = 'morning';
  else if (hour >= 12 && hour < 20) greetingKey = 'afternoon';

  const greetingNode = getNodeById('greeting');
  if (!greetingNode) return;

  const greetingText = greetingNode.messages[greetingKey];
  const options = greetingNode.options;

  // 🟦 Mensaje del sistema antes de que hable el bot
  appendSystemNotice(`${activeAssistant.name} se unió al chat`);

  appendMessageWithOptions(greetingText, options, (option) => {
    if (option === "Contratar servicio") {
      nextNode(greetingNode.next);
    } else {
      appendMessage("Por favor, selecciona una opción relacionada con nuestros servicios.", "bot");
    }
  });
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

function formatTimeElapsed(timestamp) {
  const now = new Date();
  const diffMin = Math.floor((now - timestamp) / 60000);
  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Hace ${diffHr === 1 ? "1 hora" : diffHr + " horas"}`;
  const diffDay = Math.floor(diffHr / 24);
  return `Hace ${diffDay === 1 ? "1 día" : diffDay + " días"}`;
}
