function addMessage(text, sender) {

  const chatBox =
    document.getElementById("chat-box");

  const msg =
    document.createElement("div");

  msg.classList.add("message", sender);

  msg.innerText = text;

  chatBox.appendChild(msg);

  chatBox.scrollTop =
    chatBox.scrollHeight;
}

function sendMessage() {

  const input =
    document.getElementById("user-input");

  const text = input.value;

  if (!text) return;

  addMessage(text, "user");

  input.value = "";

  setTimeout(() => {
    botResponse(text);
  }, 800);
}

function botResponse(text) {

  const lower =
    text.toLowerCase();

  if (lower.includes("despid")) {

    addMessage(
      "¿Tu contrato era indefinido o a plazo fijo?",
      "bot"
    );

  } else if (lower.includes("arriendo")) {

    addMessage(
      "¿Tienes contrato firmado con el arrendador?",
      "bot"
    );

  } else {

    addMessage(
      "Cuéntame un poco más sobre tu situación para orientarte mejor.",
      "bot"
    );
  }
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
