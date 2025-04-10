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

function appendMessage(content, sender, isTemporary = false) {
  console.log(`🗨️ appendMessage() - Sender: ${sender}`, content);
  const messages = document.getElementById("phoenix-chat-messages");
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
    if (typeof content === "object" && content.gif) {
      const text = content.text ? replaceVariables(content.text).replace(/\n/g, "<br>") + "<br>" : "";
      const gif = `<img src="${content.gif}" alt="GIF" style="max-width: 100%; border-radius: 10px;">`;
      textNode.innerHTML = text + gif;
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
  console.log("⌛ Simulando escritura. Contenido:", responseText);
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

  const rawMsg = messages[index];
  let processedMsg = rawMsg;

  console.log(`📥 Mensaje crudo (${index + 1}/${messages.length}):`, rawMsg);

  if (typeof rawMsg === 'object' && rawMsg !== null) {
    if (rawMsg.text) {
      processedMsg = {
        text: replaceVariables(rawMsg.text),
        gif: rawMsg.gif
      };
    } else {
      processedMsg = { gif: rawMsg.gif };
    }
  } else if (typeof rawMsg === 'string') {
    processedMsg = replaceVariables(rawMsg);
  }

  console.log("✅ Mensaje procesado:", processedMsg);

  simulateTypingAndRespond(() => {
    appendMessage(processedMsg, "bot");
    runMessages(messages, callback, index + 1);
  }, typeof processedMsg === 'string' ? processedMsg : (processedMsg.text || ''));
}

function nextNode(id) {
  currentNode = getNodeById(id);
  console.log("🚀 Entrando a nextNode:", id);
  console.log("📂 Contenido del nodo:", currentNode);
  if (!currentNode) return console.error("❌ Nodo no encontrado:", id);

  if (currentNode.steps) {
    currentSteps = currentNode.steps;
    currentStepIndex = 0;
    runStep();
  } else if (currentNode.messages) {
    if (currentNode.send_all) {
      console.log("📨 Enviando todos los mensajes del nodo:", currentNode.id);
      runMessages(currentNode.messages, () => {
        if (currentNode.next) nextNode(currentNode.next);
      });
    } else {
      const randomMessage = currentNode.messages[Math.floor(Math.random() * currentNode.messages.length)];
      console.log("📨 Enviando mensaje aleatorio del nodo:", randomMessage);
      simulateTypingAndRespond(() => {
        appendMessage(randomMessage, "bot");
        if (currentNode.next) nextNode(currentNode.next);
      }, randomMessage);
    }
  } else if (currentNode.question && currentNode.options) {
    console.log(`❓ Nodo ${currentNode.id} tiene pregunta y opciones. Mostrando...`);
    appendMessageWithOptions(currentNode.question, currentNode.options, (option) => {
      console.log(`✅ Usuario eligió: ${option}`);
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
  if (!step) {
    console.warn("⚠️ No se encontró el step actual. currentStepIndex:", currentStepIndex);
    return;
  }

  console.log(`🔄 Ejecutando runStep para: ${step.id}`);
  console.log("📌 Detalle del step:", step);

  const goToNext = () => {
    console.log(`➡️ goToNext ejecutado desde step: ${step.id}`);
    if (step.next) {
      const nextStepIndex = currentSteps.findIndex(s => s.id === step.next);
      if (nextStepIndex !== -1) {
        console.log(`↪️ Saltando al step: ${step.next}`);
        currentStepIndex = nextStepIndex;
        runStep();
        return;
      } else {
        console.log(`🔁 step.next no está en currentSteps. Se asume que es un nodo externo: ${step.next}`);
        return nextNode(step.next);
      }
    }

    currentStepIndex++;
    if (currentStepIndex < currentSteps.length) {
      console.log("🔼 Avanzando al siguiente step:", currentSteps[currentStepIndex].id);
      runStep();
    } else if (currentNode.next) {
      console.log("✅ Todos los steps terminados. Siguiente nodo:", currentNode.next);
      nextNode(currentNode.next);
    } else {
      console.log("⛔ Fin del flujo. No hay más pasos ni nodo siguiente.");
    }
  };

  if (step.messages) {
    const messages = step.messages.map(replaceVariables);
    if (step.send_all) {
      console.log(`📨 Step "${step.id}" tiene send_all: true. Mostrando todos los mensajes...`);
      runMessages(messages, () => {
        if (!['ask_name', 'ask_email', 'ask_phone'].includes(step.id)) goToNext();
      });
    } else {
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      console.log(`📨 Mostrando mensaje aleatorio del step "${step.id}":`, randomMessage);
      simulateTypingAndRespond(() => {
        appendMessage(randomMessage, "bot");
        if (!['ask_name', 'ask_email', 'ask_phone'].includes(step.id)) goToNext();
      }, randomMessage);
    }
  } else if (step.question && step.options) {
    console.log(`❓ Step "${step.id}" contiene pregunta y opciones. Mostrando...`);
    appendMessageWithOptions(step.question, step.options, (option) => {
      console.log(`✅ Usuario respondió "${option}" en step: ${step.id}`);
      userData[step.id] = option;

      if (step.followup) {
        console.log("📦 Step contiene mensajes de seguimiento. Mostrándolos...");
        runMessages(step.followup.map(replaceVariables), () => {
          if (step.types) {
            const typeMsgs = step.types.map(type =>
              `<b>${type.name}</b>: ${type.description}${type.example ? `<br><i>${type.example}</i>` : ''}`);
            runMessages(typeMsgs, goToNext);
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
  } else {
    console.warn(`⚠️ El step "${step.id}" no tiene messages ni question. Se llama goToNext automáticamente.`);
    goToNext();
  }
}
function handleFreeTextInput(userInput) {
  console.log("⌨️ Entrada libre del usuario:", userInput);

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
    console.log("🧍 Guardando nombre del usuario:", userInput);
    userData.name = userInput;
    goToNext();
  } else if (step.id === "ask_email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInput)) {
      console.log("❌ Email inválido:", userInput);
      return appendMessage("Ese correo no parece válido. ¿Podrías revisarlo?", "bot");
    }
    console.log("📧 Guardando email del usuario:", userInput);
    userData.email = userInput;
    goToNext();
  } else if (step.id === "ask_phone") {
    if (!/^[\d\s\+\-\(\)]{7,}$/.test(userInput)) {
      console.log("❌ Teléfono inválido:", userInput);
      return appendMessage("Ese número no parece válido. Intenta escribirlo nuevamente, por favor.", "bot");
    }
    console.log("📞 Guardando teléfono del usuario:", userInput);
    userData.phone = userInput;
    goToNext();
  }
}

function appendMessageWithOptions(text, options, onClickHandler) {
  console.log("🧭 Mostrando opciones:", options);
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
        console.log("👤 Usuario seleccionó opción:", option);
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
  console.log("🟢 DOM completamente cargado. Iniciando chatbot...");
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
    console.log("🤖 Chatbot visible");
    startChat();
  }, 1000);

  setInterval(() => {
    botMessageTimes.forEach(({ meta, timestamp }) => {
      meta.textContent = `${activeAssistant.name} • ${formatTimeElapsed(timestamp)}`;
    });
  }, 60000);
});
function startChat() {
  console.log("🚀 Iniciando conversación con el usuario...");
  const hour = new Date().getHours();
  let greetingKey = 'night';
  if (hour >= 6 && hour < 12) greetingKey = 'morning';
  else if (hour >= 12 && hour < 20) greetingKey = 'afternoon';

  const greetingNode = getNodeById('greeting');
  if (!greetingNode) {
    console.error("❌ Nodo de saludo 'greeting' no encontrado.");
    return;
  }

  const greetingText = greetingNode.messages[greetingKey];
  const options = greetingNode.options;

  console.log(`🌅 Mostrando saludo de: ${greetingKey}`, greetingText);
  appendMessageWithOptions(greetingText, options, (option) => {
    console.log(`🧭 Usuario eligió en saludo: ${option}`);
    if (option === "Contratar servicio") {
      nextNode(greetingNode.next);
    } else {
      appendMessage("Por favor, selecciona una opción relacionada con nuestros servicios.", "bot");
    }
  });
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
