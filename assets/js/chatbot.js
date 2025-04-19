// 🟦 CONFIGURACIÓN INICIAL
const phoenixChatbotBaseUrl = phoenixChatbotBaseUrlData.baseUrl;
const flow = (phoenixChatbotBaseUrlData.flow && phoenixChatbotBaseUrlData.flow.conversation) || [];

console.log("📥 Base URL:", phoenixChatbotBaseUrl);
console.log("📥 Conversational Flow:", flow);

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
let hasControlNoticeBeenShown = false;

console.log("🤖 Asistente seleccionado:", activeAssistant);

// 🔐 CREAR O RECUPERAR SESIÓN
let session_id = localStorage.getItem('phoenix_session_id');
const last_chat_session = session_id;
console.log("🆔 Sesión actual:", session_id);

// 🔧 HELPERS

function getNodeById(id) {
  const node = flow.find(node => node.id === id);
  if (!node) console.warn("⚠️ Nodo no encontrado:", id);
  return node;
}

function replaceVariables(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/\{(\w+)\}/g, (_, key) => userData[key] || `{${key}}`);
}

function saveMessageToServer(sender, message) {
  fetch(phoenixChatbotBaseUrlData.ajaxurl, {
    method: "POST",
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      action: 'phoenix_save_message',
      session_id: session_id,
      sender: sender,
      message: message
    })
  })
  .then(res => {
    if (!res.ok) {
      console.error("❌ Error en saveMessageToServer - status", res.status);
    }
    return res.json();
  })
  .then(data => {
    console.log("📤 Mensaje enviado:", { sender, message, data });
  })
  .catch(err => {
    console.error("🔥 Error al guardar mensaje:", err);
  });
}
function loadPreviousHistory(session_id, callback) {
  console.log("📦 Cargando historial para la sesión:", session_id);

  fetch(`${phoenixChatbotBaseUrlData.ajaxurl}?action=phoenix_get_messages&session_id=${session_id}`)
    .then(res => res.json())
    .then(res => {
      if (res.success && Array.isArray(res.data)) {
        const messages = res.data;
        console.log("📜 Historial recibido:", messages);

        // 🧼 LIMPIAR ANTES DE MOSTRAR HISTORIAL
        document.getElementById("phoenix-chat-messages").innerHTML = '';

        // Ordenar por fecha
        messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        messages.forEach(msg => {
          const isJoinMsg = msg.sender === 'admin' && /entr[oó] al chat$/i.test(msg.message);
          const isExitMsg = msg.sender === 'admin' && /sal[ií]o del chat$/i.test(msg.message);

          if (isJoinMsg && !hasControlNoticeBeenShown) {
            const admin = msg.message
              .replace(/^Admin:\s*/i, '')
              .replace(/\s+entr[oó] al chat$/i, '')
              .trim();

            console.log("🟢 Admin entró:", admin);
            appendSystemNotice(`${admin} tomó el control del chat`);
            hasControlNoticeBeenShown = true;
          } else if (isExitMsg) {
            const admin = msg.message
              .replace(/^Admin:\s*/i, '')
              .replace(/\s+sal[ií]o del chat$/i, '')
              .trim();

            console.log("🔴 Admin salió:", admin);
            appendSystemNotice(`${admin} salió del chat`);
          } else {
            console.log("💬 Mensaje restaurado:", msg);
            appendMessage(msg.message, msg.sender, true, true);
          }

          // Actualiza el ID máximo visto
          lastMessageId = Math.max(lastMessageId, msg.id);
        });

        callback(messages);
      } else {
        console.warn("⚠️ No se encontraron mensajes previos o hubo un error.");
        callback([]);
      }
    })
    .catch(error => {
      console.error("❌ Error cargando historial:", error);
      callback([]);
    });
}

function appendMessage(content, sender, skipHistory = false, isRestored = false) {
  console.log(`📨 Renderizando mensaje de ${sender}`, content, { skipHistory, isRestored });

  const messages = document.getElementById("phoenix-chat-messages");
  const msgWrapper = document.createElement("div");
  msgWrapper.className = "phoenix-message " + sender;

  if (skipHistory) msgWrapper.classList.add("phoenix-ignore-history");
  if (isRestored) msgWrapper.classList.add("phoenix-restored");

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

    // Eliminar avatar duplicado de mensajes anteriores del bot
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

  if (!skipHistory && !isRestored) {
    saveMessageToServer(sender, typeof content === 'string' ? content : (content.text || ''));
  }

  return msgWrapper;
}

function appendSystemNotice(text) {
  console.log("📢 Aviso del sistema:", text);

  const messages = document.getElementById("phoenix-chat-messages");
  const notice = document.createElement("div");
  notice.textContent = text;
  notice.style.textAlign = "center";
  notice.style.color = "#888";
  notice.style.fontSize = "14px";
  notice.style.margin = "20px 0";
  messages.appendChild(notice);

  requestAnimationFrame(() => {
    messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
  });
}
let lastMessageId = 0;
let botStopped = false;

fetch(`${phoenixChatbotBaseUrlData.ajaxurl}?action=phoenix_get_messages&session_id=${session_id}`)
  .then(res => res.json())
  .then(res => {
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      lastMessageId = res.data[res.data.length - 1].id;
      console.log("📍 Último mensaje detectado (inicio):", lastMessageId);
    }
  });

setInterval(() => {
  if (!session_id || botStopped) return;

  fetch(`${phoenixChatbotBaseUrlData.ajaxurl}?action=phoenix_get_messages&session_id=${session_id}&after=${lastMessageId}`)
    .then(res => res.json())
    .then(res => {
      if (res.success && Array.isArray(res.data)) {
        res.data.forEach(msg => {
          if (msg.id > lastMessageId) {
            const messageText = msg.message.toLowerCase();

            if (/entr[oó] al chat$/.test(messageText) && !hasControlNoticeBeenShown) {
              const admin = msg.message
                .replace(/^Admin:\s*/i, '')
                .replace(/\s+entr[oó] al chat$/i, '')
                .trim();
              console.log("🟢 Admin entró (live):", admin);
              appendSystemNotice(`${admin} tomó el control del chat`);
              hasControlNoticeBeenShown = true;
              botStopped = true;
            }

            if (/sal[ií]o del chat$/.test(messageText)) {
              const admin = msg.message
                .replace(/^Admin:\s*/i, '')
                .replace(/\s+sal[ií]o del chat$/i, '')
                .trim();
              console.log("🔴 Admin salió (live):", admin);
              appendSystemNotice(`${admin} salió del chat`);
            }

            lastMessageId = msg.id;
          }
        });
      }
    })
    .catch(err => {
      console.error("❌ Error en el polling de mensajes:", err);
    });
}, 3000);
function appendMessageWithOptions(text, options, onClickHandler) {
  console.log("📌 Mostrando opciones:", options);

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
        console.log("🖱️ Usuario seleccionó opción:", option);
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

function appendOptionsDirect(questionText, options, onClickHandler) {
  console.log("📌 Mostrando opciones directas:", options);
  if (questionText) appendMessage(questionText, "bot");

  const messages = document.getElementById("phoenix-chat-messages");
  const buttonRow = document.createElement("div");
  buttonRow.className = "phoenix-option-buttons";

  options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "phoenix-option-button";
    button.textContent = option;
    button.onclick = function () {
      console.log("🖱️ Usuario seleccionó opción directa:", option);
      appendMessage(option, "user");

      if (currentNode?.id) {
        userData[currentNode.id] = option;
        localStorage.setItem('phoenix_userdata', JSON.stringify(userData));
      }

      buttonRow.remove();
      onClickHandler(option);
    };
    buttonRow.appendChild(button);
  });

  messages.appendChild(buttonRow);
  requestAnimationFrame(() => {
    messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
  });
}

function runStep() {
  const step = currentSteps[currentStepIndex];
  if (!step) {
    console.warn("⚠️ Paso no encontrado. Index:", currentStepIndex);
    return;
  }

  console.log("▶️ Ejecutando step:", step.id);

  localStorage.setItem('phoenix_last_node', currentNode?.id || '');
  localStorage.setItem('phoenix_last_step_index', currentStepIndex);

  const goToNext = () => {
    console.log("⏭️ Continuando al siguiente paso...");
    if (step.next) {
      const nextStepIndex = currentSteps.findIndex(s => s.id === step.next);
      if (nextStepIndex !== -1) {
        currentStepIndex = nextStepIndex;
        runStep();
        return;
      } else {
        nextNode(step.next);
        return;
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
      console.log(`📥 Usuario respondió "${step.id}" con:`, option);
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
  console.log("⌨️ Usuario escribió:", userInput);
  if (!currentNode || !currentNode.steps) return;

  const step = currentSteps[currentStepIndex];
  if (!step) return;

  const goToNext = () => {
    currentStepIndex++;
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

    if (currentStepIndex < currentSteps.length) {
      runStep();
    } else if (currentNode.next) {
      nextNode(currentNode.next);
    }
  };

  if (step.id === "ask_name") {
    userData.name = userInput;
    console.log("📛 Nombre capturado:", userInput);
    localStorage.setItem('phoenix_userdata', JSON.stringify(userData));
    goToNext();
  } else if (step.id === "ask_email") {
    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(userInput)) {
      console.warn("📧 Email inválido:", userInput);
      return appendMessage("Ese correo no parece válido. ¿Podrías revisarlo?", "bot");
    }
    userData.email = userInput;
    console.log("📧 Email capturado:", userInput);
    localStorage.setItem('phoenix_userdata', JSON.stringify(userData));
    goToNext();
  } else if (step.id === "ask_phone") {
    if (!/^\d{7,}$/.test(userInput)) {
      console.warn("📱 Teléfono inválido:", userInput);
      return appendMessage("Ese número no parece válido. Intenta escribirlo nuevamente, por favor.", "bot");
    }
    userData.phone = userInput;
    console.log("📱 Teléfono capturado:", userInput);
    localStorage.setItem('phoenix_userdata', JSON.stringify(userData));
    goToNext();
  }
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

  console.log(`💬 Mostrando mensaje automático [${index + 1}/${messages.length}]`, processedMsg);

  simulateTypingAndRespond(() => {
    appendMessage(processedMsg, "bot");
    runMessages(messages, callback, index + 1);
  }, typeof processedMsg === 'string' ? processedMsg : (processedMsg.text || ''));
}

function nextNode(id) {
  currentNode = getNodeById(id);
  if (!currentNode) {
    console.warn("⚠️ Nodo siguiente no encontrado:", id);
    return;
  }

  console.log("🔀 Nodo actual:", currentNode.id);

  localStorage.setItem('phoenix_last_node', currentNode?.id || '');
  localStorage.setItem('phoenix_last_step_index', currentStepIndex);

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
      console.log(`📥 Usuario respondió "${currentNode.id}" con:`, option);
      userData[currentNode.id] = option;
      if (currentNode.next_if && currentNode.next_if[option]) {
        nextNode(currentNode.next_if[option]);
      } else {
        nextNode(currentNode.next);
      }
    });
  }
}

function startChat() {
  console.log("🌟 Iniciando flujo desde greeting...");

  const hour = new Date().getHours();
  let greetingKey = 'night';
  if (hour >= 6 && hour < 12) greetingKey = 'morning';
  else if (hour >= 12 && hour < 20) greetingKey = 'afternoon';

  const greetingNode = getNodeById('greeting');
  if (!greetingNode) {
    console.error("❌ Nodo greeting no encontrado");
    return;
  }

  const greetingText = greetingNode.messages[greetingKey];
  const options = greetingNode.options;

  appendSystemNotice(`${activeAssistant.name} se unió al chat`);
  console.log("🗣️ Greeting lanzado:", greetingText, options);

  setTimeout(() => {
    appendMessageWithOptions(greetingText, options, (option) => {
      console.log("✅ Opción seleccionada en greeting:", option);
      if (option === "Contratar servicio") {
        nextNode(greetingNode.next);
      } else {
        appendMessage("Por favor, selecciona una opción relacionada con nuestros servicios.", "bot");
      }
    });
  }, 1000);
}
document.addEventListener("DOMContentLoaded", function () {
  console.log("📦 DOM completamente cargado.");

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
    initPhoenixChat();
  }, 1000);

  setInterval(() => {
    botMessageTimes.forEach(({ meta, timestamp }) => {
      meta.textContent = `${activeAssistant.name} • ${formatTimeElapsed(timestamp)}`;
    });
  }, 60000);
});
