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
   CHAT DEMO ANIMATION (100% DINÁMICO)
========================= */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startDemoChat() {
  const demoBox = document.getElementById("demoChatBox");
  if (!demoBox) return;

  // 1. Limpieza absoluta del contenedor por seguridad
  demoBox.innerHTML = "";

  // 2. Data Estructural extraída completamente del HTML
  const demoDataset = [
    { text: "Hola. Soy el asistente legal de Abolegal. ¿Qué ocurrió?", sender: "bot" },
    { text: "Me despidieron sin aviso.", sender: "user" },
    { text: "Entiendo. ¿Tu contrato era indefinido?", sender: "bot" },
    { text: "Sí, trabajé 4 años.", sender: "user" },
    { text: "Perfecto. Podrías tener derecho a indemnización.", sender: "bot" }
  ];

  // 3. Crear el componente dinámico de Typing (puntos suspensivos)
  const typingIndicator = document.createElement("div");
  typingIndicator.className = "typing demo-typing";
  typingIndicator.innerHTML = "<span></span><span></span><span></span>";

  await sleep(500);

  // 4. Ciclo de renderizado secuencial limpio
  for (let i = 0; i < demoDataset.length; i++) {
    const currentMsg = demoDataset[i];

    // Si es un mensaje del Bot, mostramos la simulación de escritura previa
    if (currentMsg.sender === "bot") {
      demoBox.appendChild(typingIndicator);
      typingIndicator.classList.add("show");
      demoBox.scrollTop = demoBox.scrollHeight;
      
      await sleep(1200);
      
      typingIndicator.classList.remove("show");
      if (typingIndicator.parentNode) {
        typingIndicator.parentNode.removeChild(typingIndicator);
      }
    }

    // Inyectar el mensaje real al DOM en su estado activo directo
    const msgElement = document.createElement("div");
    msgElement.className = `message ${currentMsg.sender} demo-msg show`;
    msgElement.innerText = currentMsg.text;
    
    demoBox.appendChild(msgElement);
    demoBox.scrollTop = demoBox.scrollHeight;

    await sleep(1100);
  }
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", startDemoChat);
} else {
  startDemoChat();
}


/* =========================
   AI VOICE BACKGROUND
========================= */

const canvas = document.getElementById("bg-canvas");

if (canvas) {

  const ctx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  const bars = [];

  const BAR_COUNT = 90;

  for (let i = 0; i < BAR_COUNT; i++) {

    bars.push({
      x: (window.innerWidth / BAR_COUNT) * i,
      width: 3 + Math.random() * 3,
      height: 40 + Math.random() * 120,
      speed: 0.5 + Math.random() * 1.5,
      offset: Math.random() * 1000
    });

  }

  function animateBackground(time) {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < bars.length; i++) {

      const b = bars[i];

      const wave =
        Math.sin((time * 0.001 * b.speed) + b.offset);

      const dynamicHeight =
        b.height * (0.45 + (wave + 1) / 2);

      const x = b.x;
      const y =
        canvas.height / 2 - dynamicHeight / 2;

      const gradient =
        ctx.createLinearGradient(
          0,
          y,
          0,
          y + dynamicHeight
        );

      gradient.addColorStop(0, "rgba(216,171,85,0)");
      gradient.addColorStop(0.5, "rgba(216,171,85,0.9)");
      gradient.addColorStop(1, "rgba(216,171,85,0)");

      ctx.fillStyle = gradient;

      ctx.beginPath();

      ctx.roundRect(
        x,
        y,
        b.width,
        dynamicHeight,
        10
      );

      ctx.fill();
    }

    requestAnimationFrame(animateBackground);
  }

  requestAnimationFrame(animateBackground);
}
      
