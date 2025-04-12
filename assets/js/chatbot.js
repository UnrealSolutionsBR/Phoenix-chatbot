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

// Crear o recuperar ID de sesión
let session_id = localStorage.getItem('phoenix_session_id');
const last_chat_session = session_id; // <- Esta variable se usará para saber si hay una sesión previa

function getNodeById(id) {
  return flow.find(node => node.id === id);
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
  });
}

function loadPreviousHistory(session_id, callback) {
  fetch(`${phoenixChatbotBaseUrlData.ajaxurl}?action=phoenix_get_messages&session_id=${session_id}`)
    .then(res => res.json())
    .then(res => {
      if (res.success && Array.isArray(res.data)) {
        res.data.forEach(msg => {
          appendMessage(msg.message, msg.sender);
        });
        callback();
      } else {
        callback();
      }
    });
}

function appendMessage(content, sender, skipHistory = false) {
  const messages = document.getElementById("phoenix-chat-messages");
  const msgWrapper = document.createElement("div");
  msgWrapper.className = "phoenix-message " + sender;

  if (skipHistory) {
    msgWrapper.classList.add("phoenix-ignore-history");
  }

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

    // Avatar condicional si ya hubo otro mensaje del bot
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

  // ✅ Guardar en historial solo si no se marca para omitir
  if (!skipHistory) {
    saveMessageToServer(sender, typeof content === 'string' ? content : (content.text || ''));
  }

  return msgWrapper;
}

function appendSystemNotice(text) {
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

  const delay = Math.floor(Math.random() * 4000) + 1000;

  setTimeout(() => {
    loading.remove();
    callback();
  }, delay);
}

function initPhoenixChat() {
  // 1. Restaurar datos del usuario si existen
  const savedData = localStorage.getItem('phoenix_userdata');
  if (savedData) {
    try {
      userData = JSON.parse(savedData);
    } catch (e) {
      userData = {};
    }
  }

  // 2. Restaurar asistente activo o asignar uno si no hay
  const storedAssistant = localStorage.getItem('phoenix_assistant');
  if (storedAssistant) {
    try {
      activeAssistant = JSON.parse(storedAssistant);
    } catch (e) {
      activeAssistant = null;
    }
  }

  if (!activeAssistant) {
    activeAssistant = phoenixAssistants[Math.floor(Math.random() * phoenixAssistants.length)];
    localStorage.setItem('phoenix_assistant', JSON.stringify(activeAssistant));
  }

  userData.bot_name = activeAssistant.name;

  // 3. Verificar si hay una sesión previa con historial
  if (last_chat_session) {
    fetch(`${phoenixChatbotBaseUrlData.ajaxurl}?action=phoenix_get_messages&session_id=${last_chat_session}`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data.length > 0) {
          appendSystemNotice(`${activeAssistant.name} se unió al chat`);

          const msg = appendMessage(
            "Hola. Notamos que ya ha iniciado una conversación previamente. ¿Le gustaría continuar o empezar de nuevo?",
            "bot",
            true
          );

          const messages = document.getElementById("phoenix-chat-messages");
          const buttonRow = document.createElement("div");
          buttonRow.className = "phoenix-option-buttons";

          ["Reiniciar", "Continuar"].forEach((option) => {
            const button = document.createElement("button");
            button.className = "phoenix-option-button";
            button.textContent = option;
            button.onclick = function () {
              const userMsg = appendMessage(option, "user", true);
              buttonRow.remove();
              msg.remove();
              userMsg.remove();

              if (option === "Reiniciar") {
                session_id = 'sess_' + Math.random().toString(36).substring(2, 12);
                localStorage.setItem('phoenix_session_id', session_id);
                localStorage.removeItem('phoenix_last_node');
                localStorage.removeItem('phoenix_last_step_index');
                localStorage.removeItem('phoenix_userdata');
                localStorage.removeItem('phoenix_assistant');
                startChat();
              } else {
                session_id = last_chat_session;
                loadPreviousHistory(session_id, () => {
                  const lastNodeId = localStorage.getItem('phoenix_last_node');
                  const lastStepIndex = parseInt(localStorage.getItem('phoenix_last_step_index'), 10);

                  if (lastNodeId) {
                    currentNode = getNodeById(lastNodeId);

                    if (currentNode?.steps) {
                      currentSteps = currentNode.steps;
                      currentStepIndex = isNaN(lastStepIndex) ? 0 : lastStepIndex;

                      const step = currentSteps[currentStepIndex];
                      const stepKey = step?.id;
                      const lastMessage = res.data[res.data.length - 1];
                      let wasAlreadySent = false;

                      if (stepKey && userData[stepKey]) {
                        currentStepIndex++;
                      } else if (lastMessage?.sender === "bot") {
                        // Verificar si mensaje ya fue enviado
                        if (step?.messages) {
                          wasAlreadySent = step.messages.some(msg => {
                            if (typeof msg === 'string') return msg === lastMessage.message;
                            if (typeof msg === 'object' && msg.text) return replaceVariables(msg.text) === lastMessage.message;
                            return false;
                          });
                        }

                        if (step?.question && typeof step.question === 'string') {
                          wasAlreadySent ||= replaceVariables(step.question) === lastMessage.message;
                        }

                        if (wasAlreadySent) return;
                      }

                      runStep();
                    } else {
                      const lastMessage = res.data[res.data.length - 1];
                      let wasAlreadySent = false;

                      if (currentNode?.question && currentNode?.options) {
                        wasAlreadySent = replaceVariables(currentNode.question) === lastMessage.message;

                        if (wasAlreadySent) {
                          // Mostrar solo las opciones sin repetir la pregunta
                          appendOptionsDirect(null, currentNode.options, (option) => {
                            userData[currentNode.id] = option;
                            localStorage.setItem('phoenix_userdata', JSON.stringify(userData));
                            if (currentNode.next_if && currentNode.next_if[option]) {
                              nextNode(currentNode.next_if[option]);
                            } else {
                              nextNode(currentNode.next);
                            }
                          });                          
                          return;
                        }
                      }

                      nextNode(currentNode.id);
                    }
                  } else {
                    startChat();
                  }
                });
              }
            };
            buttonRow.appendChild(button);
          });

          messages.appendChild(buttonRow);
          requestAnimationFrame(() => {
            messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
          });

        } else {
          session_id = 'sess_' + Math.random().toString(36).substring(2, 12);
          localStorage.setItem('phoenix_session_id', session_id);
          startChat();
        }
      });
  } else {
    session_id = 'sess_' + Math.random().toString(36).substring(2, 12);
    localStorage.setItem('phoenix_session_id', session_id);
    startChat();
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

  simulateTypingAndRespond(() => {
    appendMessage(processedMsg, "bot");
    runMessages(messages, callback, index + 1);
  }, typeof processedMsg === 'string' ? processedMsg : (processedMsg.text || ''));
}

function nextNode(id) {
  currentNode = getNodeById(id);
  if (!currentNode) return;

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

  localStorage.setItem('phoenix_last_node', currentNode?.id || '');
  localStorage.setItem('phoenix_last_step_index', currentStepIndex);

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
    localStorage.setItem('phoenix_userdata', JSON.stringify(userData));
    goToNext();
  } else if (step.id === "ask_email") {
    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(userInput)) {
      return appendMessage("Ese correo no parece válido. ¿Podrías revisarlo?", "bot");
    }
    userData.email = userInput;
    localStorage.setItem('phoenix_userdata', JSON.stringify(userData));
    goToNext();
  } else if (step.id === "ask_phone") {
    if (!/^\d{7,}$/.test(userInput)) {
      return appendMessage("Ese número no parece válido. Intenta escribirlo nuevamente, por favor.", "bot");
    }
    userData.phone = userInput;
    localStorage.setItem('phoenix_userdata', JSON.stringify(userData));
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

function appendOptionsDirect(questionText, options, onClickHandler) {
  if (questionText) appendMessage(questionText, "bot");

  const messages = document.getElementById("phoenix-chat-messages");
  const buttonRow = document.createElement("div");
  buttonRow.className = "phoenix-option-buttons";

  options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "phoenix-option-button";
    button.textContent = option;
    button.onclick = function () {
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

function startChat() {
  const hour = new Date().getHours();
  let greetingKey = 'night';
  if (hour >= 6 && hour < 12) greetingKey = 'morning';
  else if (hour >= 12 && hour < 20) greetingKey = 'afternoon';

  const greetingNode = getNodeById('greeting');
  if (!greetingNode) return;

  const greetingText = greetingNode.messages[greetingKey];
  const options = greetingNode.options;

  appendSystemNotice(`${activeAssistant.name} se unió al chat`);

  setTimeout(() => {
    appendMessageWithOptions(greetingText, options, (option) => {
      if (option === "Contratar servicio") {
        nextNode(greetingNode.next);
      } else {
        appendMessage("Por favor, selecciona una opción relacionada con nuestros servicios.", "bot");
      }
    });
  }, 1000);
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
    initPhoenixChat();
  }, 1000);

  setInterval(() => {
    botMessageTimes.forEach(({ meta, timestamp }) => {
      meta.textContent = `${activeAssistant.name} • ${formatTimeElapsed(timestamp)}`;
    });
  }, 60000);
});

function formatTimeElapsed(timestamp) {
  const now = new Date();
  const diffMs = now - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffMonth / 12);

  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHr < 24) return `Hace ${diffHr === 1 ? "1 hora" : diffHr + " horas"}`;
  if (diffDay < 30) return `Hace ${diffDay === 1 ? "1 día" : diffDay + " días"}`;
  if (diffMonth < 12) return `Hace ${diffMonth === 1 ? "1 mes" : diffMonth + " meses"}`;
  return `Hace ${diffYear === 1 ? "1 año" : diffYear + " años"}`;
}
