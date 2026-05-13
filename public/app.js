/* =========================
   CONFIGURACIÓN Y SELECTORES
========================= */
const BACKEND_URL = window.location.origin;
const SESSION_KEY = 'abolegal_session_id';
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

let sessionId = localStorage.getItem(SESSION_KEY) || ('abolegal-' + Date.now());
if (!localStorage.getItem(SESSION_KEY)) localStorage.setItem(SESSION_KEY, sessionId);

let bookingState = {
  dia: null,
  hora: null
};

/* =========================
   FUNCIONES CORE CHAT
========================= */
function addMessage(text, sender) {
  if (!chatMessages) return;
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.innerText = text;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";
  userInput.disabled = true;
  if (sendButton) sendButton.disabled = true;

  try {
    // CORRECCIÓN: El chat debe ir a /api/chat, no a calendar
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message: text })
    });

    const data = await response.json();
    if (data.reply) {
      addMessage(data.reply, "bot");
    }
  } catch (error) {
    console.error("Error:", error);
    addMessage("Error de conexión con el asistente.", "bot");
  } finally {
    userInput.disabled = false;
    if (sendButton) sendButton.disabled = false;
    userInput.focus();
  }
}

/* =========================
   MÓDULO DE AGENDAMIENTO
========================= */

function actualizarHorasDisponibles(elementoDia) {
  const ahora = new Date();
  const hoyNumero = ahora.getDate(); 
  const diaTexto = elementoDia.innerText.toLowerCase();
  const diaEnBoton = parseInt(diaTexto.match(/\d+/) || 0);

  const botonesHora = document.querySelectorAll('.booking-times button');
  
  // Si el día ya pasó, ocultamos el botón del día
  if (diaEnBoton > 0 && diaEnBoton < hoyNumero) {
    elementoDia.style.display = 'none';
    return;
  }

  const esHoy = (diaEnBoton === hoyNumero);

  botonesHora.forEach(btn => {
    const horaBoton = parseInt(btn.innerText.split(':')[0]);
    if (esHoy && horaBoton <= ahora.getHours()) {
      btn.style.display = 'none';
    } else {
      btn.style.display = 'block';
    }
  });
}

// Escuchador global de clics
document.addEventListener('click', (e) => {
  // 1. Clic en botones de DÍA
  if (e.target.classList.contains('booking-date')) {
    document.querySelectorAll('.booking-date').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    bookingState.dia = e.target.innerText; 
    
    // Resetear selección de hora
    bookingState.hora = null;
    document.querySelectorAll('.booking-times button').forEach(btn => {
        btn.style.background = '';
        btn.style.color = '';
    });

    actualizarHorasDisponibles(e.target);
  }

  // 2. Clic en botones de HORA
  if (e.target.closest('.booking-times button')) {
    const btn = e.target.closest('.booking-times button');
    document.querySelectorAll('.booking-times button').forEach(b => {
      b.style.background = '';
      b.style.color = '';
    });
    
    btn.style.background = '#ba882e';
    btn.style.color = '#151a2c';
    bookingState.hora = btn.innerText; 
  }
});

/* =========================
   PROCESO DE RESERVA FINAL
========================= */
document.addEventListener('submit', async (e) => {
  const form = e.target.closest('#booking-form');
  if (!form) return;
    
  e.preventDefault();

  const diaSeleccionado = bookingState.dia;
  const horaSeleccionada = bookingState.hora;
  const nombreUsuario = form.querySelector('input[type="text"][placeholder*="Nombre"]')?.value;
  const emailUsuario = form.querySelector('input[type="email"]')?.value;

  if (!diaSeleccionado || !horaSeleccionada || !nombreUsuario || !emailUsuario) {
    alert("Por favor, completa nombre, email y selecciona día y hora.");
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  const textoOriginal = submitBtn.innerText;

  try {
    submitBtn.innerText = "Procesando...";
    submitBtn.disabled = true;

    const response = await fetch(`${BACKEND_URL}/api/calendar/create-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        dia: diaSeleccionado,
        hora: horaSeleccionada,
        nombre: nombreUsuario,
        email: emailUsuario
      })
    });

    if (response.ok) {
      alert(`¡Cita agendada para el ${diaSeleccionado} a las ${horaSeleccionada}!`);
      location.reload(); 
    } else {
      throw new Error("Error en el servidor");
    }
  } catch (error) {
    alert("No pudimos completar el agendamiento.");
  } finally {
    submitBtn.innerText = textoOriginal;
    submitBtn.disabled = false;
  }
});

/* =========================
   EVENTOS E INTERFAZ (UI)
========================= */
if (sendButton) sendButton.addEventListener("click", sendMessage);
if (userInput) {
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
}

// El resto de tus funciones de animación (resize, drawVoiceWave, etc.)
// ... (Omitidas aquí para brevedad, pero mantenlas en tu archivo local)
