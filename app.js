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
   ANIMACIÓN DE FONDO
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
     GRID
  ===================== */

  function drawGrid() {

    const spacing = 60;

    ctx.strokeStyle =
      "rgba(186,136,46,0.05)";

    ctx.lineWidth = 1;

    /* horizontales */
    for (
      let y = 0;
      y < canvas.height;
      y += spacing
    ) {

      ctx.beginPath();

      ctx.moveTo(0, y);

      ctx.lineTo(
        canvas.width,
        y
      );

      ctx.stroke();
    }

    /* verticales */
    for (
      let x = 0;
      x < canvas.width;
      x += spacing
    ) {

      ctx.beginPath();

      ctx.moveTo(x, 0);

      ctx.lineTo(
        x,
        canvas.height
      );

      ctx.stroke();
    }
  }

  /* =====================
     LÍNEAS FLUYENDO
  ===================== */

  function drawFlow() {

    for (let i = 0; i < 12; i++) {

      const baseY =

        (
          i * 120
          - (t * 0.35)
          + canvas.height
        )

        % canvas.height;

      const wave =

        Math.sin(
          (t * 0.01) + i
        ) * 20;

      const y =
        baseY + wave;

      const gradient =

        ctx.createLinearGradient(
          0,
          y,
          canvas.width,
          y
        );

      gradient.addColorStop(
        0,
        "rgba(186,136,46,0)"
      );

      gradient.addColorStop(
        0.5,
        "rgba(186,136,46,0.06)"
      );

      gradient.addColorStop(
        1,
        "rgba(186,136,46,0)"
      );

      ctx.fillStyle =
        gradient;

      ctx.fillRect(
        0,
        y,
        canvas.width,
        2
      );
    }
  }

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

    drawGrid();

    drawFlow();

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

  menu.style.display =

    menu.style.display === "flex"

      ? "none"

      : "flex";
}
