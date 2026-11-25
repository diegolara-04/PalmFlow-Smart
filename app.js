
const STORAGE_KEY = "palmflow_demo_records";

const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll(".nav-button");
const form = document.getElementById("laborForm");

function getRecords() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function showPage(pageId) {
  pages.forEach((page) => {
    page.classList.toggle("hidden", page.id !== pageId);
  });

  navButtons.forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.page === pageId
    );
  });
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => {
    showPage(button.dataset.go);
  });
});

function updateDashboard(records) {
  const realizadas = records.filter(
    (record) => record.estado === "Realizado"
  );

  document.getElementById("totalRegistros").textContent =
    records.length;

  document.getElementById("totalDescapachos").textContent =
    realizadas.filter(
      (record) => record.labor === "Descapacho"
    ).length;

  document.getElementById("totalAplicaciones").textContent =
    realizadas.filter(
      (record) => record.labor === "Aplicación"
    ).length;
}

function renderHistory(records) {
  const body = document.getElementById("historialBody");
  const emptyMessage = document.getElementById("emptyMessage");

  body.replaceChildren();

  emptyMessage.hidden = records.length > 0;

  [...records].reverse().forEach((record) => {
    const row = document.createElement("tr");

    const values = [
      `S${record.sector} · L${record.linea} · P${record.palma}`,
      record.labor,
      record.estado,
      record.fecha
    ];

    values.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    body.appendChild(row);
  });
}

function refreshApp() {
  const records = getRecords();
  updateDashboard(records);
  renderHistory(records);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(form);

  const record = {
    id: crypto.randomUUID(),
    sector: data.get("sector").trim(),
    linea: data.get("linea").trim(),
    palma: data.get("palma").trim(),
    labor: data.get("labor"),
    estado: data.get("estado"),
    observaciones: data.get("observaciones").trim(),
    fecha: new Date().toLocaleString("es-CO")
  };

  const records = getRecords();
  records.push(record);
  saveRecords(records);

  refreshApp();
  form.reset();
  showPage("historial");

  alert("Registro de demostración guardado.");
});


// Dictado por voz: usa Web Speech API cuando el navegador lo admite.
const startVoiceButton = document.getElementById("startVoice");
const stopVoiceButton = document.getElementById("stopVoice");
const voiceTranscript = document.getElementById("voiceTranscript");
const voiceStatus = document.getElementById("voiceStatus");
const copyTranscriptButton = document.getElementById("copyTranscript");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;

function setVoiceStatus(message, state = "") {
  voiceStatus.textContent = message;
  voiceStatus.classList.toggle("is-listening", state === "listening");
  voiceStatus.classList.toggle("is-error", state === "error");
}

if (!SpeechRecognition) {
  startVoiceButton.disabled = true;
  stopVoiceButton.disabled = true;
  setVoiceStatus("Este navegador no admite dictado por voz. Puedes completar el formulario manualmente.", "error");
} else {
  recognition = new SpeechRecognition();
  recognition.lang = "es-CO";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    isListening = true;
    startVoiceButton.disabled = true;
    stopVoiceButton.disabled = false;
    setVoiceStatus("Escuchando... habla cerca del micrófono.", "listening");
  };

  recognition.onresult = (event) => {
    let finalText = "";
    let interimText = "";

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const phrase = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalText += phrase + " ";
      } else {
        interimText += phrase;
      }
    }

    if (finalText.trim()) {
      voiceTranscript.value = `${voiceTranscript.value} ${finalText}`.trim();
    }

    if (interimText) {
      setVoiceStatus(`Reconociendo: ${interimText}`, "listening");
    } else if (isListening) {
      setVoiceStatus("Escuchando...", "listening");
    }
  };

  recognition.onerror = (event) => {
    const messages = {
      "not-allowed": "Permite el acceso al micrófono en el navegador para usar el dictado.",
      "no-speech": "No se detectó voz. Intenta hablar un poco más cerca del micrófono.",
      "audio-capture": "No se encontró un micrófono disponible.",
      "network": "Hubo un problema de conexión durante el reconocimiento de voz."
    };
    setVoiceStatus(messages[event.error] || `No se pudo completar el dictado (${event.error}).`, "error");
  };

  recognition.onend = () => {
    isListening = false;
    startVoiceButton.disabled = false;
    stopVoiceButton.disabled = true;
    if (!voiceStatus.classList.contains("is-error")) {
      setVoiceStatus(voiceTranscript.value.trim() ? "Dictado finalizado. Revisa la transcripción." : "Micrófono listo para usar.");
    }
  };

  startVoiceButton.addEventListener("click", () => {
    if (isListening) return;
    try {
      recognition.start();
    } catch (error) {
      setVoiceStatus("El micrófono ya está iniciando. Espera un momento e inténtalo de nuevo.", "error");
    }
  });

  stopVoiceButton.addEventListener("click", () => {
    if (recognition && isListening) recognition.stop();
  });
}

copyTranscriptButton.addEventListener("click", () => {
  const transcript = voiceTranscript.value.trim();
  const observations = form.elements.namedItem("observaciones");

  if (!transcript) {
    setVoiceStatus("Primero realiza un dictado para obtener una transcripción.", "error");
    return;
  }

  observations.value = observations.value.trim()
    ? `${observations.value.trim()}\n${transcript}`
    : transcript;
  observations.focus();
  setVoiceStatus("Transcripción copiada a observaciones. Completa y verifica los demás campos.");
});

// Detiene el reconocimiento si el usuario cambia de página o envía el formulario.
form.addEventListener("submit", () => {
  if (recognition && isListening) recognition.stop();
});

refreshApp();
