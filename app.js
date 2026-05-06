function addMessage(text, sender) {
  const chatBox = document.getElementById("chat-box");

  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.innerText = text;

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById("user-input");
  const text = input.value;

  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  setTimeout(() => {
    botResponse(text);
  }, 800);
}

function botResponse(text) {
  const lower = text.toLowerCase();

  if (lower.includes("despid")) {
    addMessage("¿Tu contrato era indefinido o a plazo fijo?", "bot");
  } else if (lower.includes("arriendo")) {
    addMessage("¿Tienes contrato firmado con el arrendador?", "bot");
  } else {
    addMessage("Cuéntame un poco más sobre tu situación para orientarte mejor.", "bot");
  }
}

/* =========================
   ANIMACIÓN DE FONDO LIMPIA
========================= */

window.addEventListener("DOMContentLoaded", () => {

  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener("resize", resize);
  resize();

  let t = 0;

  function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo base elegante (profundo, estable)
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, "#0b1220");
    bg.addColorStop(1, "#0f172a");

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // niebla suave dorada
    const haze = ctx.createRadialGradient(
      canvas.width * 0.5,
      canvas.height * 0.4,
      100,
      canvas.width * 0.5,
      canvas.height * 0.5,
      canvas.width
    );

    haze.addColorStop(0, "rgba(186,136,46,0.05)");
    haze.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // luces suaves flotantes (pocas y elegantes)
    for (let i = 0; i < 3; i++) {

      const x = canvas.width * (0.3 + i * 0.2);
      const y = canvas.height * 0.5 + Math.sin(t * 0.0008 + i) * 50;

      const glow = ctx.createRadialGradient(x, y, 0, x, y, 320);

      glow.addColorStop(0, "rgba(186,136,46,0.06)");
      glow.addColorStop(1, "rgba(186,136,46,0)");

      ctx.fillStyle = glow;

      ctx.beginPath();
      ctx.arc(x, y, 320, 0, Math.PI * 2);
      ctx.fill();
    }

    t++;
    requestAnimationFrame(draw);
  }

  draw();
});
