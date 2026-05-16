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
    bookingState.hora = null; // Resetea la hora al cambiar de día

    // Extrae el número del día (Ej: "Mié 13" -> 13)
    const diaNumero = parseInt(bookingState.dia.match(/\d+/)[0]);
    // Formatea fecha para el backend (2026-05-DD)
    const fechaISO = `2026-05-${String(diaNumero).padStart(2, "0")}`;

    await cargarDisponibilidad(fechaISO);
  }
});

/* =========================
   BOOKING FORM
========================= */

window.addEventListener("DOMContentLoaded", () => {

  const bookingForm =
    document.querySelector(".booking-form");

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

    const nombreUsuario =
      bookingForm.querySelector('input[type="text"]')?.value?.trim();

    const emailUsuario =
      bookingForm.querySelector('input[type="email"]')?.value?.trim();

    const comentarios =
      bookingForm.querySelector('textarea')?.value?.trim();

    console.log("📦 BOOKING DATA:", {
      diaSeleccionado,
      horaSeleccionada,
      nombreUsuario,
      emailUsuario,
      comentarios
    });

    if (
      !diaSeleccionado ||
      !horaSeleccionada ||
      !nombreUsuario ||
      !emailUsuario
    ) {

      console.error("❌ VALIDACIÓN FALLIDA BOOKING");

      alert(
        "Por favor completa nombre, email y selecciona día y hora."
      );

      return;
    }

    const submitBtn =
      bookingForm.querySelector('button[type="submit"]');

    const textoOriginal =
      submitBtn.innerText;

    try {

      submitBtn.innerText = "Procesando...";
      submitBtn.disabled = true;

      console.log("🚀 ENVIANDO BOOKING");

      const response = await fetch(
        `${BACKEND_URL}/api/calendar/create-event`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            sessionId,
            dia: diaSeleccionado,
            hora: horaSeleccionada,
            nombre: nombreUsuario,
            email: emailUsuario,
            comentarios
          })
        }
      );

      console.log("📡 STATUS BOOKING:", response.status);

      const result = await response.json();

      console.log("📨 RESPONSE BOOKING:", result);

      if (response.ok) {

        alert(
          `¡Cita agendada para el ${diaSeleccionado} a las ${horaSeleccionada}!`
        );

        location.reload();

      } else {

        console.error("❌ ERROR BOOKING");

        alert("Error al agendar.");

      }

    } catch (error) {

      console.error("❌ ERROR BOOKING:", error);

      alert(
        "No pudimos completar el agendamiento."
      );

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
    
    // Si no es Sábado (6) ni Domingo (0), lo asignamos al botón
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

  console.log("━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📨 CONTACT MODULE INIT");

  const contactForm =
    document.querySelector(".contact-form");

  console.log("🔍 FORM ENCONTRADO:", !!contactForm);

  if (!contactForm) {
    console.error("❌ NO EXISTE .contact-form");
    return;
  }

  contactForm.addEventListener("submit", async (e) => {

    console.log("━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📨 SUBMIT DETECTADO");

    e.preventDefault();
    e.stopPropagation();

    console.log("✅ preventDefault ejecutado");

    const submitBtn =
      contactForm.querySelector('button[type="submit"]');

    const modal =
      document.getElementById("contactSuccessModal");

    const payload = {

      name:
        contactForm.querySelector('[name="name"]')?.value || "",

      email:
        contactForm.querySelector('[name="email"]')?.value || "",

      message:
        contactForm.querySelector('[name="message"]')?.value || ""

    };

    console.log("📦 PAYLOAD:", payload);

    if (
      !payload.name ||
      !payload.email ||
      !payload.message
    ) {
      console.error("❌ VALIDACIÓN FRONT");
      alert("Completa todos los campos");
      return;
    }

    try {

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "Enviando...";
      }

      console.log("🚀 FETCH /api/contact");

      const response = await fetch(
        `${BACKEND_URL}/api/contact`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify(payload)
        }
      );

      console.log("📡 STATUS:", response.status);

      const result = await response.text();

      console.log("📨 RESPONSE RAW:");
      console.log(result);

      if (!response.ok) {

        console.error("❌ BACKEND ERROR");

        alert(
          "Error backend:\n\n" +
          result
        );

        return;
      }

      console.log("✅ MENSAJE ENVIADO");

      if (modal) {
        modal.style.display = "flex";
      } else {
        alert("Mensaje enviado correctamente");
      }

      contactForm.reset();

    } catch (error) {

      console.error("❌ FETCH ERROR");
      console.error(error);

      alert(
        "ERROR FETCH:\n\n" +
        error.message
      );

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
  const messages = document.querySelectorAll(".demo-chat .demo-msg");
  const typing = document.querySelector(".demo-chat .typing");

  if (!messages.length || !typing) return;

  // reset estado
  messages.forEach(m => m.classList.remove("show"));
  typing.classList.remove("show");

  await sleep(800);

  for (let i = 0; i < messages.length; i++) {

    // mostrar mensaje
    messages[i].classList.add("show");

    await sleep(900);

    // mostrar typing entre mensajes (excepto el último)
    if (i < messages.length - 1) {
      typing.classList.add("show");
      await sleep(1200);
      typing.classList.remove("show");
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  startDemoChat();
});
