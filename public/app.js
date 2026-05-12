// --- CONFIGURACIÓN Y SELECTORES ---
const BACKEND_URL = window.location.origin;
const SESSION_KEY = 'abolegal_session_id';
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

let sessionId = localStorage.getItem(SESSION_KEY) || ('abolegal-' + Date.now());
if (!localStorage.getItem(SESSION_KEY)) localStorage.setItem(SESSION_KEY, sessionId);

// --- FUNCIONES CORE ---
function addMessage(text, sender) {
  if (!chatMessages) return;
  const msg = document.createElement("div");
  msg.classList.add("message", sender); // sender debe ser 'user' o 'bot'
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

// --- CONEXIÓN DE EVENTOS ---
if (sendButton) sendButton.addEventListener("click", sendMessage);
if (userInput) {
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
}

/* =========================
   ANIMACIÓN VOZ IA
========================= */

window.addEventListener("DOMContentLoaded", () => {

  const canvas =
    document.getElementById("bg-canvas");

  const ctx =
    canvas.getContext("2d");

  function resize() {

    canvas.width =
      window.innerWidth;

    canvas.height =
      window.innerHeight;
  }

  window.addEventListener(
    "resize",
    resize
  );

  resize();

  let t = 0;

  /* =====================
     FONDO
  ===================== */

  function drawBackground() {

    const bg =

      ctx.createLinearGradient(
        0,
        0,
        0,
        canvas.height
      );

    bg.addColorStop(
      0,
      "#0b1220"
    );

    bg.addColorStop(
      1,
      "#0f172a"
    );

    ctx.fillStyle = bg;

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );
  }

  /* =====================
     ONDAS IA
  ===================== */

  function drawVoiceWave() {

    const lines = 7;

    for (let i = 0; i < lines; i++) {

      const centerY =

        canvas.height / 2
        + (i - lines / 2) * 45;

      ctx.beginPath();

      for (
        let x = 0;
        x <= canvas.width;
        x += 8
      ) {

        const wave =

          Math.sin(
            x * 0.008
            + t * 0.025
            + i
          ) * 18

          +

          Math.sin(
            x * 0.02
            + t * 0.015
          ) * 8;

        const y =
          centerY + wave;

        if (x === 0) {

          ctx.moveTo(x, y);

        } else {

          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle =
        `rgba(186,136,46,${
          0.05 + i * 0.015
        })`;

      ctx.lineWidth = 1.2;

      ctx.stroke();
    }
  }

  /* =====================
     PARTICULAS
  ===================== */

  function drawParticles() {

    for (let i = 0; i < 40; i++) {

      const x =

        (
          i * 137
          + t * 0.3
        )

        % canvas.width;

      const y =

        canvas.height / 2

        +

        Math.sin(
          x * 0.01
          + t * 0.02
        ) * 120;

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        1.2,
        0,
        Math.PI * 2
      );

      ctx.fillStyle =
        "rgba(186,136,46,0.12)";

      ctx.fill();
    }
  }

  /* =====================
     LOOP
  ===================== */

  function animate() {

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    drawBackground();

    drawVoiceWave();

    drawParticles();

    t++;

    requestAnimationFrame(
      animate
    );
  }

  animate();
});

/* =========================
   MOBILE MENU
========================= */
function toggleMenu() {

  const menu =
    document.getElementById(
      "mobileMenu"
    );

  menu.classList.toggle(
    "active"
  );
}

const mobileLinks =
  document.querySelectorAll(
    "#mobileMenu a"
  );

mobileLinks.forEach(link => {

  link.addEventListener(
    "click",
    () => {

      document
        .getElementById("mobileMenu")
        .classList.remove(
          "active"
        );
    }
  );

});

/* =========================
   SOCIAL PROOF POPUPS
========================= */

const socialMessages = [

  "Recibí orientación en menos de 5 minutos.",

  "Muy clara la explicación del asistente legal.",

  "La videollamada fue profesional y rápida.",

  "Pude entender mi caso antes de contratar.",

  "El asistente me ayudó a ordenar todo.",

  "Excelente experiencia con ABOLEGAL.",

  "Muy útil para entender mis derechos laborales.",

  "Sentí apoyo desde el primer momento."
];

const socialPopup =
  document.getElementById(
    "social-proof-popup"
  );

const socialPopupText =
  document.getElementById(
    "social-popup-text"
  );

let socialIndex = 0;

function showSocialPopup() {

  socialPopupText.innerText =
    socialMessages[socialIndex];

  socialPopup.classList.add(
    "show"
  );

  setTimeout(() => {

    socialPopup.classList.remove(
      "show"
    );

  }, 5000);

  socialIndex++;

  if (
    socialIndex >= socialMessages.length
  ) {
    socialIndex = 0;
  }
}

/* START */

setTimeout(() => {

  showSocialPopup();

  setInterval(() => {

    showSocialPopup();

  }, 12000);

}, 4000);

/* =========================
   LÓGICA SINCRONIZADA DEMO
========================= */
async function iniciarDemo() {
  const mensajes = document.querySelectorAll('.demo-msg');
  const typing = document.querySelector('.typing');
  const sleep = ms => new Promise(res => setTimeout(res, ms));

  for (let i = 0; i < mensajes.length; i++) {
    // 1. Mostrar que el bot está escribiendo (solo si es mensaje del bot)
    if (mensajes[i].classList.contains('bot')) {
      typing.classList.add('show');
      await sleep(1200);
      typing.classList.remove('show');
    }
    
    // 2. Mostrar el mensaje
    mensajes[i].style.display = 'block';
    await sleep(50); // Pequeño respiro para el navegador
    mensajes[i].classList.add('show');
    
    // 3. Esperar antes del siguiente
    await sleep(1500);
  }
}

// Arrancar cuando la página esté lista
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(iniciarDemo, 1000);
});

/* =========================
   MÓDULO DE AGENDAMIENTO (FIX)
========================= */

let bookingState = {
  dia: null,
  hora: null
};

document.addEventListener('click', (e) => {
  // 1. Manejo de Clic en Días
  if (e.target.classList.contains('booking-date')) {
    // Limpiar selección de otros días
    document.querySelectorAll('.booking-date').forEach(btn => btn.classList.remove('active'));
    // Activar el actual
    e.target.classList.add('active');
    
    // Resetear visualmente los botones de hora al cambiar de día
    document.querySelectorAll('.booking-times button').forEach(btn => {
        btn.style.background = '';
        btn.style.color = '';
    });

    actualizarHorasDisponibles(e.target);
  }

  // 2. Manejo de Clic en Horas
  if (e.target.closest('.booking-times button')) {
    const btn = e.target.closest('.booking-times button');
    // Limpiar selección de otras horas
    document.querySelectorAll('.booking-times button').forEach(b => {
      b.style.background = '';
      b.style.color = '';
    });
    // Activar la actual (Estilo directo para asegurar prioridad)
    btn.style.background = '#ba882e';
    btn.style.color = '#151a2c';
  }
});

function actualizarHorasDisponibles(elementoDia) {
  const ahora = new Date();
  const diaTexto = elementoDia.innerText.toLowerCase();
  
  // Determinamos si el día clickeado es "hoy" (Martes 12 de Mayo en este caso)
  // Nota: Ajustamos a "12" porque es el día actual según el sistema
  const esHoy = diaTexto.includes('12'); 

  const botonesHora = document.querySelectorAll('.booking-times button');
  
  botonesHora.forEach(btn => {
    const horaBoton = parseInt(btn.innerText.split(':')[0]);
    
    if (esHoy && horaBoton <= ahora.getHours()) {
      // Si la hora ya pasó o es la hora actual, la ocultamos
      btn.style.display = 'none';
    } else {
      // Si es un día futuro o una hora posterior, la mostramos
      btn.style.display = 'block';
    }
  });
}
/* =========================
   PROCESO DE RESERVA FINAL
========================= */

document.addEventListener('submit', async (e) => {
  // Verificamos si el formulario que se intenta enviar es el de agendamiento
  if (e.target.closest('#booking-form') || e.target.innerHTML.includes('Agendar')) {
    
    // 1. EVITAR REINICIO: Detenemos el comportamiento por defecto del navegador
    e.preventDefault();

    // 2. RECOPILAR DATOS: Buscamos lo que el usuario seleccionó
    const diaSeleccionado = bookingState.dia;
    const horaSeleccionada = bookingState.hora;
    const botonHora = Array.from(document.querySelectorAll('.booking-times button'))
                           .find(b => b.style.background === 'rgb(186, 136, 46)' || b.style.background === '#ba882e');
    const horaSeleccionada = botonHora?.innerText;
    
    // Capturamos inputs de contacto (ajusta los IDs si son distintos en tu HTML)
    const nombreUsuario = document.querySelector('input[type="text"][placeholder*="Nombre"]')?.value;
    const emailUsuario = document.querySelector('input[type="email"]')?.value;

    // 3. VALIDACIÓN: Si falta algo, avisamos y no seguimos
    if (!diaSeleccionado || !horaSeleccionada) {
      alert("Por favor, selecciona un día y una hora antes de agendar.");
      return;
    }

    // 4. ENVÍO AL BACKEND
    const submitBtn = e.target.querySelector('button[type="submit"]') || e.target;
    const textoOriginal = submitBtn.innerText;

    try {
      submitBtn.innerText = "Procesando...";
      submitBtn.disabled = true;

      const response = await fetch(${BACKEND_URL}/api/calendar/create-event, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          dia: diaSeleccionado,
          hora: horaSeleccionada,
          nombre: nombreUsuario,
          email: emailUsuario
        })
      });

      if (response.ok) {
        // 5. ÉXITO: Feedback visual al usuario
        alert(`¡Cita agendada para el ${diaSeleccionado} a las ${horaSeleccionada}! Te llegará un correo de confirmación.`);
        // Opcional: Podrías redirigir a una página de gracias o limpiar el formulario
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error en el servidor");
      }

    } catch (error) {
      console.error("Error al agendar:", error);
      alert("No pudimos completar el agendamiento. Por favor, intenta más tarde.");
    } finally {
      submitBtn.innerText = textoOriginal;
      submitBtn.disabled = false;
    }
  }
});
