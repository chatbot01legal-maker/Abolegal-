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
   MÓDULO DE AGENDAMIENTO (NUEVO FLUJO)
========================= */

async function cargarDisponibilidad(fechaISO) {
  const container = document.getElementById("bookingTimes");
  container.innerHTML = "<p style='font-size: 0.9rem; color: #666;'>Cargando horarios...</p>";

  try {
    const response = await fetch(`${BACKEND_URL}/api/calendar/availability?date=${fechaISO}`);
    const data = await response.json();
    
    container.innerHTML = "";

    if (!data.availableSlots || data.availableSlots.length === 0) {
      container.innerHTML = `<div class="no-slots" style="padding: 10px; color: #d9534f; font-weight: 500;">No hay horarios disponibles</div>`;
      return;
    }

    data.availableSlots.forEach(hora => {
      const btn = document.createElement("button");
      btn.innerText = hora;
      
      btn.addEventListener("click", () => {
        document.querySelectorAll("#bookingTimes button").forEach(b => {
          b.style.background = "";
          b.style.color = "";
        });
        btn.style.background = "#ba882e";
        btn.style.color = "#151a2c";
        bookingState.hora = hora;
      });
      
      container.appendChild(btn);
    });
  } catch (error) {
    console.error("❌ Error cargando disponibilidad", error);
    container.innerHTML = `<div class="no-slots">Error al cargar horarios. Intente más tarde.</div>`;
  }
}

// Escuchador global de clics para DÍAS
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("booking-date")) {
    document.querySelectorAll(".booking-date").forEach(btn => btn.classList.remove("active"));
    e.target.classList.add("active");

    bookingState.dia = e.target.innerText;
    bookingState.hora = null;

    const diaNumero = parseInt(bookingState.dia.match(/\d+/)[0]);
    const fechaISO = `2026-05-${String(diaNumero).padStart(2, "0")}`;

    await cargarDisponibilidad(fechaISO);
  }
});

/* =========================
   BOOKING FORM
========================= */

window.addEventListener("DOMContentLoaded", () => {
  const bookingForm = document.querySelector(".booking-form");
  console.log("📅 BOOKING FORM:", bookingForm);

  if (!bookingForm) {
    console.log("ℹ️ No existe booking-form en esta página");
    return;
  }

  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("📨 SUBMIT BOOKING");

    const diaSeleccionado = bookingState.dia;
    const horaSeleccionada = bookingState.hora;
    const nombreUsuario = bookingForm.querySelector('input[type="text"]')?.value?.trim();
    const emailUsuario = bookingForm.querySelector('input[type="email"]')?.value?.trim();
    const comentarios = bookingForm.querySelector('textarea')?.value?.trim();

    if (!diaSeleccionado || !horaSeleccionada || !nombreUsuario || !emailUsuario) {
      console.error("❌ VALIDACIÓN FALLIDA BOOKING");
      alert("Por favor completa nombre, email y selecciona día y hora.");
      return;
    }

    const submitBtn = bookingForm.querySelector('button[type="submit"]');
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
          email: emailUsuario,
          comentarios
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert(`¡Cita agendada para el ${diaSeleccionado} a las ${horaSeleccionada}!`);
        location.reload();
      } else {
        alert("Error al agendar.");
      }
    } catch (error) {
      console.error("❌ Error booking:", error);
      alert("No pudimos completar el agendamiento.");
    } finally {
      submitBtn.innerText = textoOriginal;
      submitBtn.disabled = false;
    }
  });
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

window.addEventListener('DOMContentLoaded', () => {
  const nombresDias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const hoy = new Date();
  const botonesDias = document.querySelectorAll('.booking-date');
  
  let diasAgregados = 0;
  let intentoOffset = 0;

  while (diasAgregados < botonesDias.length) {
    const fechaCandidata = new Date();
    fechaCandidata.setDate(hoy.getDate() + intentoOffset);
    const numeroDiaSemana = fechaCandidata.getDay();
    
    if (numeroDiaSemana !== 0 && numeroDiaSemana !== 6) {
      botonesDias[diasAgregados].innerText = `${nombresDias[numeroDiaSemana]} ${fechaCandidata.getDate()}`;
      diasAgregados++;
    }
    intentoOffset++;
  }
  if (botonesDias.length > 0) botonesDias[0].click();
});

/* =========================
   CONTACT FORM DEBUG
========================= */
window.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.querySelector(".contact-form");
  if (!contactForm) return;

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const modal = document.getElementById("contactSuccessModal");

    const payload = {
      name: contactForm.querySelector('[name="name"]')?.value || "",
      email: contactForm.querySelector('[name="email"]')?.value || "",
      message: contactForm.querySelector('[name="message"]')?.value || ""
    };

    if (!payload.name || !payload.email || !payload.message) {
      alert("Completa todos los campos");
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "Enviando...";
      }

      const response = await fetch(`${BACKEND_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.text();

      if (!response.ok) {
        alert("Error backend:\n\n" + result);
        return;
      }

      if (modal) {
        modal.style.display = "flex";
      } else {
        alert("Mensaje enviado correctamente");
      }
      contactForm.reset();
    } catch (error) {
      alert("ERROR FETCH:\n\n" + error.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = "Enviar consulta";
      }
    }
  });
});

/* =========================
   MOBILE MENU
========================= */
function toggleMenu() {
  const mobileMenu = document.getElementById("mobileMenu");
  mobileMenu.classList.toggle("active");
}

/* =========================
   CHAT DEMO ANIMATION
========================= */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startDemoChat() {
  const messages = document.querySelectorAll(".demo-messages .demo-msg");
  const typing = document.querySelector(".demo-messages .typing");

  if (!messages.length || !typing) return;

  // Limpieza inicial forzada
  messages.forEach(m => m.classList.remove("show"));
  typing.classList.remove("show");

  await sleep(600);

  for (let i = 0; i < messages.length; i++) {
    // 1. Mostrar burbuja de typing antes de que aparezca un mensaje del bot
    if (i > 0 && messages[i].classList.contains("bot")) {
      typing.classList.add("show");
      await sleep(1400);
      typing.classList.remove("show");
      await sleep(200);
    }

    // 2. Renderizar el mensaje
    messages[i].classList.add("show");
    await sleep(1000);
  }
}

// Blindaje contra desfases de carga en tablets
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", startDemoChat);
} else {
  startDemoChat();
}
       
